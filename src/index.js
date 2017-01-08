import robot from 'robotjs';
import React from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';
import App from './components/App';

// Create our screen
const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'React Blessed Hot Motion'
});

// Let user quit the app
screen.key(['C-c'], function(ch, key) {
  return exit();
});

function exit() {
  return process.exit(process.env.NODE_ENV === 'production' ? 0 : 2)
}

function handleSelectCommand(text) {
  screen.destroy();
  robot.typeString(text);
  // robot.keyTap('enter');
  return exit();
}

// Render React component into screen
render(<App onSelectCommand={handleSelectCommand} args={process.argv.slice(2)} />, screen);

// Don't overwrite the screen
// console.log = function () { };
// console.warn = function () { };
// console.error = function () { };
// console.info = function () { };
// console.debug = function () { };
