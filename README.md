# eChook GPT Configuration Website
For use with the dev branch of the eChook GPT Arduino Nano code, this setup moves the calibration from the hard coded calibration.h file into the EEPROM on the Arduino.
This Webapp connects to the eChook over serial to allow convenient set up, data viewing and calibration.

https://echook.github.io/gpt-nano-configurator/

## Browser Compatibility
This webapp uses WebSerial to communicate with the eChook. WebSerial is only supported in Chrome, Edge and Opera Desktop browsers. There is no Firefox, Safari or mobile support.

See this article for further information: https://developer.mozilla.org/en-US/docs/Web/API/Serial#browser_compatibility
