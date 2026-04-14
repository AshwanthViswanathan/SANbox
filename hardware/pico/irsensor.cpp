#include <IRremote.h>
#include <Keyboard.h>

#define IR_PIN 16

void pressAndRelease(uint8_t key) {
  Keyboard.press(key);
  delay(40);
  Keyboard.release(key);
}

void typeChar(char c) {
  Keyboard.print(c);
}

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
  Keyboard.begin();
}

void loop() {
  if (IrReceiver.decode()) {
    // Ignore held-button repeats
    if (IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT) {
      IrReceiver.resume();
      return;
    }

    // IRremote exposes decoded data in decodedIRData, including command.
    uint8_t cmd = IrReceiver.decodedIRData.command;

    switch (cmd) {
      // Numbers
      case 0x45: typeChar('1'); break;
      case 0x46: typeChar('2'); break;
      case 0x47: typeChar('3'); break;
      case 0x44: typeChar('4'); break;
      case 0x40: typeChar('5'); break;
      case 0x43: typeChar('6'); break;
      case 0x07: typeChar('7'); break;
      case 0x15: typeChar('8'); break;
      case 0x09: typeChar('9'); break;
      case 0x19: typeChar('0'); break;

      // Special Characters
      case 0x16: typeChar('*'); break;
      case 0x0D: typeChar('#'); break;

      // Arrows
      case 0x18: pressAndRelease(KEY_UP_ARROW); break;
      case 0x52: pressAndRelease(KEY_DOWN_ARROW); break;
      case 0x08: pressAndRelease(KEY_LEFT_ARROW); break;
      case 0x5A: pressAndRelease(KEY_RIGHT_ARROW); break;

      // OK -> Enter
      case 0x1C: pressAndRelease(KEY_RETURN); break;

      default:
        Serial.print("Unknown command: 0x");
        Serial.println(cmd, HEX);
        break;
    }

    IrReceiver.resume();
  }
}