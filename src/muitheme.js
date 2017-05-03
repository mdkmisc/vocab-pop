import _ from './supergroup' // in global space anyway...
import muiThemeable from 'material-ui/styles/muiThemeable'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
//import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'

import {
  blue200,
  teal500, teal700,
  greenA200,
  teal50,
  brown50,
  teal100,
  grey100, grey300, grey400, grey500,
  white, darkBlack, fullBlack,
} from 'material-ui/styles/colors'
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator'
import * as colorManipulator from 'material-ui/utils/colorManipulator'
window.colorManipulator = colorManipulator

export const baseColors = {
  S: '#0070dd',
  C: '#a335ee',
  X: '#a71a19',
  neutral: grey400,
  //main: teal500,
  //main: 'steelblue',
  main: blue200,
}

export const subThemeColors = _.mapValues(
  baseColors,
  baseColor => ({
          light: lighten(baseColor, 0.95),
          light: lighten(baseColor, 0.8),
          regular: lighten(baseColor, 0.4),
          dark: baseColor,
          darker: darken(baseColor, 0.4),
          primary1Color: lighten(baseColor, 0.2),
          //textColor: darkBlack,
          //alternateTextColor: white,
          //canvasColor: white,
          //borderColor: grey300,
          //pickerHeaderColor: teal500,
          //shadowColor: fullBlack,
    }))

export const getColors = (subTheme='main') => subThemeColors[subTheme]

export const subThemeStyles = _.fromPairs(_.map(
  subThemeColors,
  (colors, sub) => ([
    sub, 
    {
      headerDark: {
        fontSize: '1.8em',
        color: 'white',
        backgroundColor: colors.darker,
        //margin: '7px 0px 3px 0px',
        //padding: '0px 5px 0px 5px',
        padding: 15,
        //borderBottom: 'solid 1px #ccc',
      },
      headerLight: {
        fontSize: '1.6em',
        color: colors.darker,
        backgroundColor: colors.light,
        //margin: '7px 0px 3px 0px',
        //padding: '0px 5px 0px 5px',
        borderBottom: `solid 1px ${colors.darker}`,
        padding: 10,
      },
    }])
))

export const getStyles = (subTheme='main') => subThemeStyles[subTheme]

export const atlasColors = {
  // from OHDSI style guide, http://www.ohdsi.org/web/wiki/doku.php?id=development:style_guide
  atlasDarkBg: '#003142',
  atlasAltDarkBg: '#333333',
  atlasLightBg: '#cccccc',
  atlasDisabledBg: '#cccccc',

  atlasActive: '#f19119',
  atlasHighlight: '#f19119',

  atlasAltActive: '#337ab7',
  atlasAltHighlight: '#337ab7',

  atlasAlt2Active: '#b7cbdc',
  atlasAlt2Highlight: '#b7cbdc',
}
export const atlasStyles = {
    headerLight: {
      fontSize: '14px',
      color: '#000',
      margin: '7px 0px 3px 0px',
      padding: '0px 5px 0px 5px',
      borderBottom: 'solid 1px #ccc',
    },
    headerDark: { // sort of atlas, not really
      fontSize: '14px',
      color: 'white',
      backgroundColor: atlasColors.atlasDarkBg,
      margin: '7px 0px 3px 0px',
      padding: '0px 5px 0px 5px',
      borderBottom: 'solid 1px #ccc',
    },
  }
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
    ...atlasColors,
    ...subThemeColors.neutral,
  },
  appBar: {
    height: 50,
  },
})

export const scThemes = _.mapValues(subThemeColors, c=>getMuiTheme({palette:c}))

console.log({default:getMuiTheme(), scThemes, subThemeColors, subThemeStyles})
