import _ from 'src/supergroup' // in global space anyway...
import muiThemeable from 'material-ui/styles/muiThemeable'
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
/*
const subThemeStyles = _.fromPairs(_.map(
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
*/
const getColors = subTheme => subThemeColors[subTheme]
const getStyles = subTheme => {   //subThemeStyles[subTheme]
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
      backgroundColor: getColors(subTheme).regular,
    },
    topRoot: { // just for ConceptViewContainers
      margin: '3%',
      zoom: 0.8, 
      borderRadius: '.8em',
      backgroundColor: getColors(subTheme).light,
      boxShadow: `inset 0 0 .9em .5em ${getColors(subTheme).darker} 0 0 .9em .5em ${getColors(subTheme).darker}`,
    },
    plainRoot: {
      zoom: 0.8, 
      borderRadius: '.8em',
    },
  }
}

let DT = getMuiTheme(darkBaseTheme)
let LT = getMuiTheme(lightBaseTheme)

const defaultTheme = getMuiTheme(
    LT,   // redundant, it starts here anyway
    {palette: getColors('main')}
  )

export default (props={}) => {
  let {
        muiTheme=defaultTheme, 
        sub='main', sc, // synonyms
        themeProps, // for setting
  } = props
  sub = sub || sc
  let theme = getMuiTheme(
    muiTheme,
    {palette: { ...getColors(sub||sc) }},
    { ...getStyles(sub||sc) },
    themeProps
  )
  return request => {
    if (!request)
      return theme
    return _.get(theme, request)
  }
}

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
    //boxShadow: `.2em .2em .7em ${muit.getColors().darker}`,
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
    backgroundColor: muit.getColors(sc).light,
    background: `linear-gradient(to top, 
                                  ${muit.getColors(sc).light} 0%,
                                  ${muit.getColors(sc).regular} 70%,
                                  ${muit.getColors(sc).dark} 100%)`,
    width: '100%',
    //minHeight: 100,
  }),
  tileTitle: {
    fontSize: '1.6em',
    color: 'white',
    //color: muit.getColors().darker,
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

