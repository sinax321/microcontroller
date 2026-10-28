/**
  ******************************************************************************
  * @file           : stm32_sample_main.c
  * @brief          : HomeGuard IoT Firmware Reference for STM32F103C8T6 Blue Pill
  *                   Handles MFRC522 RFID, SG90 PWM Servo, DS18B20 Temp, and
  *                   Newline-Delimited JSON Bluetooth Telemetry on USART1.
  ******************************************************************************
  * @attention
  * Educational qualifier project reference code.
  ******************************************************************************
  */

#include "main.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

/* Private variables ---------------------------------------------------------*/
UART_HandleTypeDef huart1;
TIM_HandleTypeDef htim2;
SPI_HandleTypeDef hspi1;

/* Ring Buffer for USART1 Incoming Stream */
#define RX_BUFFER_SIZE 256
uint8_t rx_byte;
char rx_line[RX_BUFFER_SIZE];
uint16_t rx_index = 0;
volatile bool line_ready = false;

/* System State */
typedef enum {
    DOOR_LOCKED = 0,
    DOOR_UNLOCKED = 1
} DoorState_t;

DoorState_t g_door_state = DOOR_LOCKED;
uint8_t g_servo_angle = 0;
float g_temperature = 27.8f;
float g_warning_threshold = 40.0f;
float g_critical_threshold = 50.0f;
uint32_t g_auto_lock_tick = 0;
const uint32_t AUTO_LOCK_DELAY_MS = 5000;

/* Whitelist of authorized RFID UIDs */
const char* const AUTHORIZED_UIDS[] = {
    "E2:7B:44:90",  /* Member 1: Alex Rivera */
    "93:F1:82:1C",  /* Member 2: Sarah Chen */
    "4A:2D:69:B3"   /* Member 3: Evaluator pass */
};
const uint8_t AUTHORIZED_COUNT = 3;

/* Function Prototypes -------------------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_USART1_UART_Init(void);
static void MX_TIM2_Init(void);
static void MX_SPI1_Init(void);

void Set_Servo_Angle(uint8_t angle);
void Send_Telemetry(void);
void Send_Access_Event(const char* uid, const char* name, const char* id, bool granted);
void Process_Incoming_Command(const char* json_str);
float Read_Temperature(void);
void Check_RFID_Scanner(void);

/**
  * @brief  Main program entry point
  */
int main(void)
{
    HAL_Init();
    SystemClock_Config();

    MX_GPIO_Init();
    MX_USART1_UART_Init();
    MX_TIM2_Init();
    MX_SPI1_Init();

    /* Start PWM on TIM2 Channel 1 for SG90 Servo */
    HAL_TIM_PWM_Start(&htim2, TIM_CHANNEL_1);
    Set_Servo_Angle(0); /* Default to LOCKED */

    /* Start Interrupt-driven UART Reception */
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

    uint32_t last_telemetry_tick = HAL_GetTick();

    /* Infinite Super-Loop */
    while (1)
    {
        uint32_t now = HAL_GetTick();

        /* 1. Periodic Telemetry Transmission (every 2000ms) */
        if (now - last_telemetry_tick >= 2000)
        {
            last_telemetry_tick = now;
            g_temperature = Read_Temperature();
            Send_Telemetry();
        }

        /* 2. Process Incoming JSON Commands from Dashboard */
        if (line_ready)
        {
            Process_Incoming_Command(rx_line);
            line_ready = false;
        }

        /* 3. Check for RFID card proximity on MFRC522 */
        Check_RFID_Scanner();

        /* 4. Auto-relock timer logic */
        if (g_door_state == DOOR_UNLOCKED && g_auto_lock_tick > 0)
        {
            if (now >= g_auto_lock_tick)
            {
                Set_Servo_Angle(0);
                g_door_state = DOOR_LOCKED;
                g_auto_lock_tick = 0;

                char ack[128];
                snprintf(ack, sizeof(ack), "{\"type\":\"ack\",\"command\":\"AUTO_LOCK\",\"status\":\"CONFIRMED\",\"servoAngle\":0}\n");
                HAL_UART_Transmit(&huart1, (uint8_t*)ack, strlen(ack), 100);
            }
        }
    }
}

/**
  * @brief  Set SG90 Servo Angle via TIM2_CH1 PWM
  * @param  angle: 0 to 180 degrees
  */
void Set_Servo_Angle(uint8_t angle)
{
    if (angle > 180) angle = 180;
    g_servo_angle = angle;

    /* 1.0ms (1000us) = 0 degrees; 2.0ms (2000us) = 180 degrees */
    uint32_t pulse = 1000 + ((uint32_t)angle * 1000) / 180;
    __HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, pulse);
}

/**
  * @brief  Send periodic newline-delimited JSON telemetry packet
  */
void Send_Telemetry(void)
{
    char buffer[160];
    snprintf(buffer, sizeof(buffer),
             "{\"type\":\"telemetry\",\"temperature\":%.1f,\"door\":\"%s\",\"servoAngle\":%d,\"rssi\":-55}\n",
             g_temperature,
             g_door_state == DOOR_UNLOCKED ? "UNLOCKED" : "LOCKED",
             g_servo_angle);

    HAL_UART_Transmit(&huart1, (uint8_t*)buffer, strlen(buffer), 200);
}

/**
  * @brief  Process parsed command string from Web App
  */
void Process_Incoming_Command(const char* json_str)
{
    char response[160];

    if (strstr(json_str, "\"command\":\"UNLOCK\"") != NULL)
    {
        Set_Servo_Angle(90);
        g_door_state = DOOR_UNLOCKED;
        g_auto_lock_tick = HAL_GetTick() + AUTO_LOCK_DELAY_MS;

        snprintf(response, sizeof(response),
                 "{\"type\":\"ack\",\"command\":\"UNLOCK\",\"status\":\"CONFIRMED\",\"servoAngle\":90}\n");
        HAL_UART_Transmit(&huart1, (uint8_t*)response, strlen(response), 100);
    }
    else if (strstr(json_str, "\"command\":\"LOCK\"") != NULL)
    {
        Set_Servo_Angle(0);
        g_door_state = DOOR_LOCKED;
        g_auto_lock_tick = 0;

        snprintf(response, sizeof(response),
                 "{\"type\":\"ack\",\"command\":\"LOCK\",\"status\":\"CONFIRMED\",\"servoAngle\":0}\n");
        HAL_UART_Transmit(&huart1, (uint8_t*)response, strlen(response), 100);
    }
    else if (strstr(json_str, "\"command\":\"PING\"") != NULL)
    {
        snprintf(response, sizeof(response),
                 "{\"type\":\"ack\",\"command\":\"PONG\",\"uptime\":%lu}\n",
                 HAL_GetTick() / 1000);
        HAL_UART_Transmit(&huart1, (uint8_t*)response, strlen(response), 100);
    }
}

/**
  * @brief  UART Rx Transfer completed callback
  */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1)
    {
        if (rx_byte == '\n' || rx_byte == '\r')
        {
            if (rx_index > 0)
            {
                rx_line[rx_index] = '\0';
                line_ready = true;
                rx_index = 0;
            }
        }
        else
        {
            if (rx_index < RX_BUFFER_SIZE - 1)
            {
                rx_line[rx_index++] = (char)rx_byte;
            }
            else
            {
                rx_index = 0; /* Reset on overflow */
            }
        }
        HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
    }
}

/**
  * @brief  Stub for simulated / ADC / 1-Wire temperature reading
  */
float Read_Temperature(void)
{
    /* In actual hardware, read ADC1_IN1 or DS18B20 scratchpad */
    return g_temperature;
}

/**
  * @brief  Stub for MFRC522 scanning
  */
void Check_RFID_Scanner(void)
{
    /* Read PCD_Authenticate / PICC_ReadCardSerial over SPI1 */
}

/* Peripheral Initialization stubs required by STM32 HAL */
static void MX_USART1_UART_Init(void)
{
    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200;
    huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1;
    huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX_RX;
    huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart1.Init.OverSampling = UART_OVERSAMPLING_16;
    HAL_UART_Init(&huart1);
}

static void MX_TIM2_Init(void)
{
    TIM_OC_InitTypeDef sConfigOC = {0};

    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 71; /* 72MHz / 72 = 1MHz */
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.Period = 19999; /* 20ms period (50Hz) */
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    HAL_TIM_PWM_Init(&htim2);

    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = 1000; /* 1.0ms initial pulse (0 deg) */
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    HAL_TIM_PWM_ConfigChannel(&htim2, &sConfigOC, TIM_CHANNEL_1);
}

static void MX_SPI1_Init(void)
{
    hspi1.Instance = SPI1;
    hspi1.Init.Mode = SPI_MODE_MASTER;
    hspi1.Init.Direction = SPI_DIRECTION_2LINES;
    hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
    hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
    hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
    hspi1.Init.NSS = SPI_NSS_SOFT;
    hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16; /* 4.5 MHz */
    hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
    HAL_SPI_Init(&hspi1);
}

static void MX_GPIO_Init(void)
{
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
}

void SystemClock_Config(void)
{
    /* Standard 72MHz PLL Configuration from 8MHz HSE Crystal */
}
