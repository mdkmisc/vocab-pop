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
} from 'material-ui/styles/colors'
import typography from 'material-ui/styles/typography'
import {darken, fade, emphasize, lighten} from 'material-ui/utils/colorManipulator'
import * as colorManipulator from 'material-ui/utils/colorManipulator'
window.colorManipulator = colorManipulator
window.typography = typography

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
        backgroundColor: pal.regular,
      }
    },
    cardMedia: {
      /* default: (LT)
      color: darkWhite,
      overlayContentBackground: lightBlack,
      titleColor: darkWhite,
      subtitleColor: lightWhite,
      */
    },
    cardText: {
      /* default
      textColor: pal.textColor,
      */
    },
    card: {
      /*
      titleColor: fade(pal.textColor, 0.87),
      subtitleColor: fade(pal.textColor, 0.54),
      fontWeight: typography.fontWeightMedium,
      */
      titleColor: 'pink',
      subtitleColor: 'orange',
      fontWeight: typography.fontWeightMedium,
      root: {
        top: { // just for ConceptViewContainers
          margin: '3%',
          zoom: 0.8,
          borderRadius: '.8em',
          //backgroundColor: 'pink',
          backgroundColor: pal.regular,
          //boxShadow: `inset 0 0 .9em .5em #B22 0 0 .9em .5em #2BB`,
          //boxShadow: `inset 0 0 .9em .5em ${pal.darker} 0 0 .9em .5em ${pal.darker}`,
          boxShadow: `${pal.darker} 0 0 .9em .5em inset, ${pal.darker} 0 0 .9em .5em`,
          //boxShadow: `rgb(86, 121, 149) 0px 0px 0.9em 0.5em inset, rgb(86, 121, 149) 0px 0px 0.9em 0.5em`,
          //border: '2px solid red',
        },
        plain: {
          zoom: 0.8,
          borderRadius: '.8em',
          backgroundColor: pal.regular,
          //boxShadow: `${pal.darker} 0 0 .9em .5em inset, ${pal.darker} 0 0 .9em .5em`,
        },
      },
      title: {
        backgroundColor: pal.light,
        borderBottom: `solid 2px ${pal.dark}`,
        title: {
          fontSize: '1.6em',
          fontWeight: typography.fontWeightMedium,
          color: pal.darker,
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
      parent: {
        backgroundColor: pal.darker,
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        //...cardStyles.root,
      },
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
      tileTitle: {
        fontSize: '1.6em',
        color: 'white',
        //color: muit.getColor().darker,
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
      tile: {
        //zoom: 0.8,
        backgroundColor: pal.light,
        background: `linear-gradient(to top,
                                      ${pal.light} 0%,
                                      ${pal.regular} 70%,
                                      ${pal.dark} 100%)`,
        width: '100%',
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
  constructor(props) {
    this.props(props)

    // following is so I don't have to change code in Concept/index.js right now
    let req = this.request.bind(this)
    _.forEach(Object.getOwnPropertyNames(Object.getPrototypeOf(this)), n => {
      req[n] = Object.getPrototypeOf(this)[n].bind(this)
    })
    req._this = this
    return req
  }
  request(req) {
    if (!req)
      return this._theme
    return _.get(this._theme, req) || {}
  }
  theme(props) {
    if (typeof props !== 'undefined') {
      let { muiTheme,
            sub, sc, // synonyms
            themeProps, // for setting, haven't used yet
      } = props
      sub = sc || sub || 'main'
      let theme = getMuiTheme( muiTheme, {palette: getColors(sub)})
      this._theme = getMuiTheme(theme,
                                {...getStyles(theme.palette)},
                                {...themeProps})
    }
    return this._theme
  }
  palette() {
    return this._theme.palette
  }
  props(newProps) {
    if (typeof newProps !== 'undefined') {
      this._props = newProps  // merge instead of replace?
      this.theme(this._props)
    }
    return this._props
  }
  color(colorProp) {
    return this.palette()[colorProp]
    //return JSON.stringify(this._theme.palette) + ' ' + this.palette()[colorProp]
  }
  wrapElement(el,wrapperProps={}) {
    // is this doing anything?
    console.log("wrapElement not doing anything right now")
    return el
    return  <MuiThemeProvider muiTheme={this._theme} {...wrapperProps}>
              {el}
            </MuiThemeProvider>
  }
  wrapComponent(Comp) {
    return muiThemeable(this._theme)(Comp)
  }
}
const muit = props => { // so I don't have to change code in Concept/index.js right now
  return new Muit(props)
}
export default muit
window.getMuiTheme = getMuiTheme
window.muit = muit

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

