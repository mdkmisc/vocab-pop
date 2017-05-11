import _ from 'src/supergroup' // in global space anyway...

import React, { Component } from 'react'
import muiThemeable from 'material-ui/styles/muiThemeable'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'

import {
  //http://www.material-ui.com/#/customization/colors
  blue200,
  teal500, teal700,
  greenA200,
  teal50,
  brown50,
  teal100,
  grey100, grey300, grey400, grey500,
  blueGrey400,
  white, darkBlack, fullBlack,
  deepPurple300,
  orange400,
} from 'material-ui/styles/colors'
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator'
import * as colorManipulator from 'material-ui/utils/colorManipulator'
window.colorManipulator = colorManipulator

const subThemeRootColors = {
  // S,C,X primary are from Atlas
  S: { primary: '#0070dd', accent: teal500, },
  C: { primary: '#a335ee', accent: deepPurple300, },
  X: { primary: '#a71a19', accent: orange400, },
  main: { primary: grey400, accent: blueGrey400, },
}

// http://www.material-ui.com/#/customization/themes
const subThemeColors = 
  _.mapValues(subThemeRootColors,
    rootColors => {
      const {primary, accent} = rootColors
      return {
          //regular: lighten(primary, 0.4),
          regular: primary,
          light: lighten(primary, 0.3),
          lighter: lighten(primary, 0.8),
          dark: darken(primary, 0.3),
          darker: darken(primary, 0.8),
          lighten: n => lighten(primary, n),
          darken: n => darken(primary, n),
          fade: n => fade(primary, n),
          emphasize: n => emphasize(primary, n),
          accent: {
            regular: accent,
            light: lighten(accent, 0.3),
            lighter: lighten(accent, 0.8),
            dark: darken(accent, 0.3),
            darker: darken(accent, 0.8),
          },
          textColor: darkBlack,
          alternateTextColor: white,

          primary1Color: lighten(primary, 0.2),
          accent1Color: lighten(accent, 0.2),
          canvasColor: lighten(primary, .7),
          borderColor: darken(accent, .4),
          //pickerHeaderColor: teal500,
          shadowColor: darken(primary, .8),
      }
    })

// https://github.com/callemall/material-ui/blob/master/src/styles/getMuiTheme.js
const getColors = (subTheme='main') => subThemeColors[subTheme]

let DT = getMuiTheme(darkBaseTheme)
let LT = getMuiTheme(lightBaseTheme)

const getPalette = 
  (theme=LT, subTheme='main') => getMuiTheme(
    theme, {palette:getColors(subTheme)}).palette

const getStyles = subTheme => {   //subThemeStyles[subTheme]
  let pal = getPalette(subTheme)
  return {
    flatButton: { 
      padding: '1px 3px 1px 3px',
      margin: '5px 2px 1px 2px',
      //border:'1px solid pink', 
      color: 'white',
      lineHeight:'auto',
      height:'auto',
      minHeight:'auto',
      width:'auto',
      minWidth:'auto',
      backgroundColor: pal.regular,
    },
    topRoot: { // just for ConceptViewContainers
      margin: '3%',
      zoom: 0.8, 
      borderRadius: '.8em',
      //backgroundColor: 'pink',
      backgroundColor: pal.light,
      //boxShadow: `inset 0 0 .9em .5em #B22 0 0 .9em .5em #2BB`,
      //boxShadow: `inset 0 0 .9em .5em ${pal.darker} 0 0 .9em .5em ${pal.darker}`,
      boxShadow: `${pal.darker} 0 0 .9em .5em inset, ${pal.darker} 0 0 .9em .5em`,
      //boxShadow: `rgb(86, 121, 149) 0px 0px 0.9em 0.5em inset, rgb(86, 121, 149) 0px 0px 0.9em 0.5em`,
      //border: '2px solid red',
    },
    plainRoot: {
      zoom: 0.8, 
      borderRadius: '.8em',
    },
    headerDark: {
      fontSize: '1.8em',
      color: 'white',
      backgroundColor: pal.darker,
      //margin: '7px 0px 3px 0px',
      //padding: '0px 5px 0px 5px',
      padding: 15,
      //borderBottom: 'solid 1px #ccc',
    },
    headerLight: {
      fontSize: '1.6em',
      color: pal.darker,
      backgroundColor: pal.light,
      //margin: '7px 0px 3px 0px',
      //padding: '0px 5px 0px 5px',
      borderBottom: `solid 1px ${pal.darker}`,
      padding: 10,
    },
  }
}

const assembleTheme = 
  (baseTheme=LT, 
   subTheme='main',
   themeProps={}) =>
  getMuiTheme(baseTheme,
              {palette: getColors(subTheme)},
              {...getStyles(subTheme)},
              {...themeProps})

const defaultTheme = assembleTheme()

/*
  M.color = propName => M(`palette.${propName}`)
const getColor = colorProp =>
*/
const muit = (props={}) => {
  let {
        muiTheme=defaultTheme, 
        sub, sc, // synonyms
        themeProps, // for setting
  } = props
  sub = sc || sub || 'main'
  let theme = assembleTheme(defaultTheme,sub,themeProps)

  let M = request => {
    if (!request)
      return theme
    return _.get(theme, request)
  }
  let pal = theme.palette
  M.color = colorProp => pal[colorProp]
  M.wrapElement = (el,wrapperProps={}) => 
            <MuiThemeProvider muiTheme={theme} {...wrapperProps}>
              {el}
            </MuiThemeProvider>
  return M
}
export default muit
window.getMuiTheme = getMuiTheme

//const M=muit()

  /*
    flatButton: {
      color: transparent,
      buttonFilterColor: '#999999',
      disabledTextColor: fade(palette.textColor, 0.3),
      textColor: palette.textColor,
      primaryTextColor: palette.primary1Color,
      secondaryTextColor: palette.accent1Color,
      fontSize: typography.fontStyleButtonFontSize,
      fontWeight: typography.fontWeightMedium,
    },

const styles = props => {
  //let {muiTheme, base, sc, sub} = props
  
}
const buttonStyles = {
  ccode: {
    //padding: 2,
    padding: '1px 3px 1px 3px',
    margin: '5px 2px 1px 2px',
    //margin: 2,
    //border:'1px solid pink', 
    color: 'white',
    lineHeight:'auto',
    height:'auto',
    minHeight:'auto',
    width:'auto',
    minWidth:'auto',
  },
}
const cardStyles = {
  title: {
    ...muit.getStyles().headerLight,
    //boxShadow: `.2em .2em .7em ${muit.getColor().darker}`,
    //backgroundColor: muiTheme.palette.atlasDarkBg,
    //color: muiTheme.palette.alternateTextColor,
  },
  text: {
  }
}
const gridStyles = { // GridList styles based on Simple example
                      // http://www.material-ui.com/#/components/grid-list
  parent: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    //...cardStyles.root,
  },
  gridList: {
    //border: '5px solid pink',
    width: '100%',
    //height: 450,
    horizontal: {
      display: 'flex',
      flexWrap: 'nowrap',
      overflowX: 'auto',
    },
    vertical: {
      overflowY: 'auto',
    },
  },
  listTitle: cardStyles.title,
  tile: sc => ({
    //zoom: 0.8, 
    backgroundColor: muit.getColor(sc).light,
    background: `linear-gradient(to top, 
                                  ${muit.getColor(sc).light} 0%,
                                  ${muit.getColor(sc).regular} 70%,
                                  ${muit.getColor(sc).dark} 100%)`,
    width: '100%',
    //minHeight: 100,
  }),
  tileTitle: {
    fontSize: '1.6em',
    color: 'white',
    //color: muit.getColor().darker,
  },
  child: {
    paddingTop:10,
    width: '100%',
    //marginTop: 50,  // WAS ONLY ON SC
  }
}
*/
/*
const atlasColors = {
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
const atlasStyles = {
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
*/

