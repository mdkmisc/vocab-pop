import _ from './supergroup' // in global space anyway...
import muiThemeable from 'material-ui/styles/muiThemeable';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
//import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';

import {
  teal500, teal700,
  greenA200,
  teal50,
  brown50,
  teal100,
  grey100, grey300, grey400, grey500,
  white, darkBlack, fullBlack,
} from 'material-ui/styles/colors';
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator';
import * as colorManipulator from 'material-ui/utils/colorManipulator';
window.colorManipulator = colorManipulator

export default getMuiTheme({
  palette: {
    primary1Color: teal500,
    primary2Color: teal700,
    primary3Color: grey400,
    accent1Color: greenA200,
    accent2Color: grey100,
    accent3Color: grey500,
    textColor: darkBlack,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    //disabledColor: fade(darkBlack, 0.3),
    pickerHeaderColor: teal500,
    //clockCircleColor: fade(darkBlack, 0.07),
    shadowColor: fullBlack,
  },
  appBar: {
    height: 50,
  },
});

export const baseSc = {
  S: '#0070dd',
  C: '#a335ee',
  X: '#a71a19',
}

export const scColors = {
  S: {
    light: lighten(baseSc.S, 0.8),
    regular: lighten(baseSc.S, 0.4),
    dark: baseSc.S,
    darker: darken(baseSc.S, 0.4),
    primary1Color: lighten(baseSc.S, 0.2),
    //primary2Color: baseSc.S,
    //primary3Color: darken(baseSc.S, 0.2),
    textColor: darkBlack,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    //pickerHeaderColor: teal500,
    //shadowColor: fullBlack,
  },
  C: {
    light: lighten(baseSc.C, 0.8),
    regular: lighten(baseSc.C, 0.4),
    dark: baseSc.C,
    darker: darken(baseSc.C, 0.4),
    primary1Color: lighten(baseSc.C, 0.2),
    //primary2Color: baseSc.C,
    //primary3Color: darken(baseSc.C, 0.2),
  },
  X: {
    light: lighten(baseSc.X, 0.8),
    regular: lighten(baseSc.X, 0.4),
    dark: baseSc.X,
    darker: darken(baseSc.X, 0.4),
    primary1Color: lighten(baseSc.X, 0.5),
    accent1Color: baseSc.X,
    //primary2Color: baseSc.X,
    //primary3Color: darken(baseSc.X, 0.2),
  }
}

export const scThemes = _.mapValues(scColors, c=>getMuiTheme({palette:c}))

