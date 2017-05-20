
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

/* eslint-disable */
import _ from 'src/supergroup' // in global space anyway...

import React, { Component } from 'react'
import muiThemeable from 'material-ui/styles/muiThemeable'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
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
  yellow500, yellow700,
} from 'material-ui/styles/colors'
import typography from 'material-ui/styles/typography'
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator'
import * as colorManipulator from 'material-ui/utils/colorManipulator'
window.colorManipulator = colorManipulator
window.typography = typography

const subThemeRootColors = {
  // S,C,X primary are from Atlas
  /* different primary and accent colors...
   * for now though, easier to see what's going on if i use same for both
  S: { primary: '#0070dd', accent: teal500, },
  C: { primary: '#a335ee', accent: deepPurple300, },
  X: { primary: '#a71a19', accent: orange400, },
  main: { primary: grey400, accent: blueGrey400, },
  want: { primary: yellow500, accent: yellow700, },
  */
  S: { primary: '#0070dd', accent: '#0070dd', },
  C: { primary: '#a335ee', accent: '#a335ee', },
  X: { primary: '#a71a19', accent: '#a71a19', },
  main: { primary: blueGrey400, accent: blueGrey400, },
  want: { primary: yellow700, accent: yellow700, },
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
          textColor: darken(primary, 8),
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

const getStyles = pal => {   //subThemeStyles[subTheme]
  return {
    tooltip: {
      div: {
        backgroundColor: pal.dark,
        color: pal.lighter,
      },
    },
    appBar: {
    },
    ciglDiv: { 
      padding: 4,
      backgroundColor: pal.lighter,
      //border: `4px dotted ${pal.regular}`,
      //zoom: .7,
    },
    randomDiv: {
      backgroundColor: pal.lighter,
      border: `4px solid ${pal.regular}`,
    },
    dialog: {
      styleProps: {
        bodyClassName: 'dialog-body',
        contentClassName: 'dialog-content',
        className: 'dialog',
        autoScrollBodyContent: true,
        //autoDetectWindowHeight: false,
        //bodyFontSize: 6,
        /* defaults:
        titleFontSize: 22,
        bodyFontSize: 16,
        bodyColor: fade(palette.textColor, 0.6),
        */
      },
      style: {
        zoom: .7,
        //width: '100%',
        //border: `24px solid purple`,
        /*
        width: '60%',
        zoom: .6,
        top: '50%',
        left: '20%',
        backgroundColor: 'pink',
        */
      },
      overlayStyle: { // covers the stuff behind the dialog
        /*
        backgroundColor: 'black',
        width: '100%',
        border: `24px solid purple`,
        width: '60%',
        top: '50%',
        left: '20%',
        //backgroundColor: 'orange',
        */
      },
      contentStyle: { // whole dialog (not overlay)
        //border: `24px solid green`,
        //left: '30%',
        //zoom: .6,
        width: '90%',
        maxWidth: 'auto',
        height: `${window.innerHeight * 1.1}px`,
        //top: `-${window.innerHeight * .08}px`,
        backgroundColor: 'white',
        //backgroundColor: 'green',
        //border: `24px dotted ${pal.regular}`,
      },
      bodyStyle: { // actual content...?
        //height: `${window.innerHeight * 2.8}px`,
        //maxHeight: '800px',
        //maxHeight: 'none!important',
        //border: `24px solid purple`,
        /*
        width: '80%',
        //top: '20%',
        backgroundColor: 'pink',
        */
      },
      titleStyle: {
        /*
        border: `24px solid purple`,
        backgroundColor: 'white',
        //border: `6px solid ${pal.regular}`,
        //margin: 15,
        */
        subtitle: {
          zoom: .7,
          lineHeight: '1em',
          //border: `6px solid ${pal.regular}`,
        },
      },
      actionsContainerStyle: {
        /*
        width: '100%',
        border: `24px solid purple`,
        //margin: 15,
        //border: `6px solid ${pal.regular}`,
        backgroundColor: 'white',
        */
      }
    },
    raisedButton: {
      //padding: 8,
      //margin: 4,
      width:'auto',
      minWidth:'auto',
      //border:'1px solid pink',
      //color: 'white',
      lineHeight:'auto',
      height:'auto',
      minHeight:'auto',
          padding: '1px 3px 1px 3px',
          margin: '5px 2px 1px 2px',
          backgroundColor: pal.regular,
          color: pal.alternateTextColor,
      styleProps: {
        buttonStyle: {
          backgroundColor: pal.regular,
          color: pal.alternateTextColor,
          //padding: 4,
          //margin: 4,
          //width:'auto',
          //minWidth:'auto',
          //color:'darkgray'
        },
      },
      container: {
        //padding: 20,
        //margin: 20,
        //backgroundColor: pal.lighter,
        //textColor: pal.textColor,
        //border: `1px solid ${pal.darker}`,
        //width:'auto',
      },
    },
    /* not working right
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
      styleProps: {
        // needs to be set directly on component,
        // not in style
        buttonStyle: {
          labelColor: 'purple',
          padding: 4,
          margin: 4,
          //width:'auto',
          //minWidth:'auto',
          //backgroundColor:'yellow',
          //padding: '1px 3px 1px 3px',
          //margin: '5px 2px 1px 2px',
          //labelColor: 'purple',
          //backgroundColor:'yellow',
          //color:'darkgray'
        },
      },
    },
    */
    cardMedia: {
      /* default: (LT)
      color: darkWhite,
      overlayContentBackground: lightBlack,
      titleColor: darkWhite,
      subtitleColor: lightWhite,
      */
    },
    cardTitle: {
      border: '20px solid blue',
      backgroundColor: 'pink',
      /* default
      textColor: pal.textColor,
      */
    },
    card: {
      // 
      containerStyle: { // Override the inline-styles of the container element.
          padding: 8,
          borderRadius: '.8em',
          //border: '20px solid red',
          backgroundColor: pal.light,
          boxShadow: `${pal.darker} 0 0 .9em .5em inset, ${pal.darker} 0 0 .9em .5em`,
      },
      style: { // Override the inline-styles of the root element.
      },



      /*
      border: '20px solid blue',
      titleColor: fade(pal.textColor, 0.87),
      subtitleColor: fade(pal.textColor, 0.54),
      fontWeight: typography.fontWeightMedium,
      titleColor: 'pink',
      subtitleColor: 'orange',
      */
      fontWeight: typography.fontWeightMedium,
      root: {
        top: { // just for ConceptViewContainers
          //margin: '3%',
          //zoom: 1.2,
          //boxShadow: `rgb(86, 121, 149) 0px 0px 0.9em 0.5em inset, rgb(86, 121, 149) 0px 0px 0.9em 0.5em`,
          //border: '2px solid red',
          backgroundColor: pal.regular,
        },
        plain: {
          zoom: 0.8,
          borderRadius: '.8em',
          backgroundColor: pal.regular,
          //boxShadow: `${pal.darker} 0 0 .9em .5em inset, ${pal.darker} 0 0 .9em .5em`,
        },
      },
      cardTitle: {
        border: '20px solid blue',
        /* default
        textColor: pal.textColor,
        */
      },
      title: {
        //backgroundColor: pal.lighter,
        //borderBottom: `solid 2px ${pal.dark}`,
        title: {
          fontSize: '1.6em',
          fontWeight: typography.fontWeightMedium,
          color: pal.darker,
          backgroundColor: pal.light,
          //padding: 10,
          //boxShadow: `.2em .2em .7em ${muit.getColor().darker}`,
          //backgroundColor: muiTheme.palette.atlasDarkBg,
          //color: muiTheme.palette.alternateTextColor,
        },
        subtitle: {
          zoom: 0.8,
          color: pal.regular,
          //backgroundColor: pal.regular,
          boxShadow: `inset 0 0 .4em ${pal.dark}`,
          padding: '.5em',
          //border: `9px inset ${pal.darker}`,
          //border: '9px inset black',
          //border: `9px inset ${pal.dark}`,
          surround: {
            //border: `9px inset ${pal.dark}`,
          },
        },
      },
      text: {
      }
    },
    grid: {
      styleProps: {
        cellHeight: 'auto',
      },
      parent: {
        backgroundColor: pal.darker,
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        //...cardStyles.root,
      },
      /*
      title: {
        fontSize: '1.6em',
        //color: pal.darker,
        backgroundColor: pal.dark,
        borderBottom: `solid 4px ${pal.darker}`,
        padding: 10,
        //boxShadow: `.2em .2em .7em ${muit.getColor().darker}`,
        //backgroundColor: muiTheme.palette.atlasDarkBg,
        //color: muiTheme.palette.alternateTextColor,
      },
      */
      tileTitle: {
        fontSize: '1.6em',
        color: 'white',
        //color: muit.getColor().darker,
      },
      gridList: {
        //height: 450,
        horizontal: {
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          width: '100%',
        },
        vertical: {
          overflowY: 'auto',
        },
      },
      tile: {
        plain: {
          padding: 15,
          height: '100%',
          //zoom: 0.8,
          //backgroundColor: pal.light,
        },
        zoom: 0.8,
        backgroundColor: pal.light,
        background: `linear-gradient(to top,
                                      ${pal.light} 0%,
                                      ${pal.regular} 70%,
                                      ${pal.dark} 100%)`,
        //width: '100%',
        //minHeight: 100,
      },
      child: {
        paddingTop:10,
        width: '100%',
        //marginTop: 50,  // WAS ONLY ON SC
      }
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
    linkWithCounts: {
      rootDiv: {
        //border: `1px solid ${pal.dark}`,
        backgroundColor: pal.light,
        //lineHeight: '1em',
      }
      
    },
  }
}

export class Muit {
  constructor(props={}) {
    let { muiTheme,
          sub, sc, // synonyms
          themeProps={}, // for setting, haven't used yet
          invisible=false,
    } = props
    sub = sc || sub || 'main'
    themeProps.invisible = invisible
    let theme = getMuiTheme( muiTheme, {palette: getColors(sub)})
    theme = getMuiTheme(theme,{...getStyles(theme.palette)}, {...themeProps})
    let desc = { invisible, subTheme: sub, 
                 cardTitle: JSON.stringify(theme.cardTitle) }

    let reqFunc = req => {
      if (!req)
        return theme
      return _.has(theme, req) ? _.get(theme, req) : {}
    }

    reqFunc.props = newProps => {
      if (!_.isEmpty(newProps) || !theme) {
        return muit({muiTheme:theme, ...newProps})
      }
      throw new Error("not sure what return is expected")
    }

    reqFunc.desc = () => {
      return _.map(desc, (v,k)=>`${k}: ${v}`).join(', ')
    }
    reqFunc.palette = () => {
      return theme.palette
    }
    reqFunc.color = (colorProp) => {
      return palette()[colorProp]
    }

    return reqFunc
  }
}
const muit = props => { // so I don't have to change code in Concept/index.js right now
  return new Muit(props)
}
export default muit
window.getMuiTheme = getMuiTheme
window.muit = muit
