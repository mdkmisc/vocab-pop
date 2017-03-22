  // ASSUMES JSON!!!!!!!


// adapted from cachedAjax in ohdsi.utils
import LZString from 'lz-string';
import _ from 'lodash';
import React, { Component } from 'react';
import {Glyphicon, Row, Col,
          Nav, Navbar, NavItem, Label,
          Form, FormGroup, FormControl, ControlLabel, HelpBlock,
          Button, ButtonToolbar, ButtonGroup,
          } from 'react-bootstrap';
import Rx from 'rxjs/Rx';
var $ = require('jquery');
var d3 = require('d3');
var ALLOW_CACHING = [
  '.*',
  //'/WebAPI/[^/]+/person/',
];

//var cache = {}; // only save till reload
//var cache = localStorage; // save indefinitely
var cache = sessionStorage; // save for session
export function fetchKey(url, opts={}) {
  // switch to using the getUrl
  // var key = `${url}:${JSON.stringify(opts)}`;
  // return key;
  return getUrl(url, opts);
}
export function cachedJsonFetch(url, opts={}) {  
  var allowed = _.find(ALLOW_CACHING, allowedUrl => url.match(allowedUrl));
  if (allowed) {
    //console.log(`using cache for ${url}. remove ${allowed} from ohdsi.util.ALLOW_CACHING to disable caching for it`);
  } else {
    //console.log(`not caching ${url}. add to ohdsi.util.ALLOW_CACHING to enable caching for it`);
    return jsonFetch(url, opts);
  }
  var key = fetchKey(url, opts);
  return new Promise(function(resolve, reject) {
    if (!storageExists(key, cache)) {
      jsonFetch(url, opts)
      .then(
        function(json) {
          if (json.error) {
            console.error("rejecting in success func", json.error);
            reject(json.error);
          } else {
            storagePut(key, json, cache);
            //console.log('caching', key);
            resolve(json);
          }
        },
        function(err) {
          console.error("adding this late...hope it doesn't break anything");
          reject(err);
        });
    } else {
      var results = storageGet(key, cache);
      //console.log('already cached', key, results);
      resolve(results);
    }
  });
}
function jsonFetch(url, opts={}) {
  //console.log(url, opts);
  return fetch(url, opts)
    .then(function(results) {
      return results.json();
    });
}
export function getUrl(url, params={}) {
  if (url.match(/(post|get)/i)) {
    console.warn('quit using post/get in api names');
    url = url.replace(/post/,'get').replace(/Post/,'Get');
  }

  if (_.isEmpty(params))
    return url;

  return encodeURI(
          url + '?' + _.keys(params)
                        .sort()
                        .map( key => `${key}=${params[key]}`)
                        .join('&'));
}

export function cachedPostJsonFetch(url, params={}, queryName) { // stop using queryName...put it in params in the first place
  if (queryName) {
    console.warn('quit using separate queryName arg in cachedPostJsonFetch calls');
  }
  queryName = queryName || params.queryName || 'no query name';
  var get = getUrl(url, params);
  //console.log(queryName, get);
  return cachedJsonFetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          }).then(function(json) {
            if (json.error) {
              json.error.url = get;
              json.error.queryName = queryName;
            }
            json.url = get;
            json.queryName = queryName;
            return json;
          })
}
export function cachedGetJsonFetch(url, params={}) {
  let get = getUrl(url, params);
  let queryName = params.queryName || 'no query name';
  return (cachedJsonFetch(get)
            .then(function(json) {
              if (json.error) {
                json.error.url = get;
                json.error.queryName = queryName;
              }
              json.url = get;
              json.queryName = queryName;
              return json;
            })
        );
}
/* not used in vocab-pop
export function jsonFetchMeta(url, params={}, meta={}) {
  // so you get back not just the promise, but also the getUrl,
  // which is a unique key for the fetch and a key into storage,
  // and you also get back meta data if you send any (which might
  // be useful)
  let key = getUrl(url, params);
  let promise = cachedGetJsonFetch(url, params);
  return {key, promise, meta};
}
*/
export class JsonFetcher { // this.url is the unique key
  constructor(baseUrl, params, meta) {
    this.baseUrl = baseUrl;
    this.params = params;
    this.meta = meta;
    this.url = getUrl(baseUrl, params);
    if (_.has(JsonFetcher.instances, this.url)) {
      //console.warn('JsonFetcher already exists. promises probably done already', this.url);
      let instance = JsonFetcher.instances[this.url];
      if (!_.isEqual(this.meta, instance.meta)) {
        throw new Error("treating Fetchers with different meta objs as the same, probably don't want to");
      }
      instance.newInstance = false;
      return instance;
    }
    this.queryName = params.queryName || 'no query name';
    //console.log("apicall", this.url);
    this.fetchPromise = cachedJsonFetch(this.url);
    this.jsonPromise = this.fetchPromise.then(
                          json => {
                                if (json.error) {
                                  debugger;  // not sure what to do
                                  //json.error.url = get;
                                  //json.error.queryName = queryName;
                                }
                                return this.json=json
                          });
    this.newInstance = true;
    JsonFetcher.instances[this.url] = this;
  }
}
JsonFetcher.instances = {};

export function storagePut(key, val, store = sessionStorage) {
  store[key] = LZString.compressToBase64(JSON.stringify(val));
  //let json = JSON.stringify(val);
  //let compressed = LZString.compressToBase64(json);
  //alert([json.length, compressed.length]);
  //console.log(`recs: ${val.length}, json: ${json.length}, compressed: ${compressed.length}`);
}
export function storageExists(key, store = sessionStorage) {
  return _.has(store, key);
}
export function storageGet(key, store = sessionStorage) {
  return JSON.parse(LZString.decompressFromBase64(store[key]));
}
export function storageKeys(store = sessionStorage) {
  return Object.keys(store);
}

/* SvgLayout class
  * manages layout of subcomponents in zones of an svg
  * initialize with layout like:
    var layout = new SvgLayout(w, h,
        // zones:
        {
          top: { margin: { size: 5}, }, // top zone initialized with margin
                                        // 5 pixels (or whatever units) high
          bottom: { margin: { size: 5}, },
          left: { margin: { size: 5}, },
          right: { margin: { size: 5}, },
        })
  * add components to zones like one of these:
    
    // size is constant:
    layout.add('left','axisLabel', { size: 20 })

    // size returned by function:
    layout.add('left','axisLabel', { size: ()=>axisLabel.node().getBBox().width * 1.5 })

    // provide svg element to get size from (must specify 'width' or 'height' as dim)
    layout.add('left','axis', { obj: cp.y.axisG.node(), dim:'width' })

  * retrieve dimensions of svg chart area (inside all zones):
    layout.svgWidth()
    layout.svgHeight()
  * retrieve svg dimensions:
    layout.w()
    layout.h()
  * retrieve total size of zone
    layout.zone('bottom')
  * retrieve total size of one zone element
    layout.zone('left.margin')
  * retrieve total size of more than one zone element
    layout.zone(['left.margin','left.axisLabel'])
  * y position of bottom zone:
    layout.h() - layout.zone('bottom')
  * 
  * when adding zones, you can also include a position func that will
  * do something based on the latest layout parameters
  *
    var position = function(layout) {
      // positions element to x:left margin, y: middle of svg area
      axisLabel.attr("transform", 
        `translate(${layout.zone(["left.margin"])},
                    ${layout.zone(["top"]) + (h - layout.zone(["top","bottom"])) / 2})`);
    }
    layout.add('left','axisLabel', { size: 20 }, position: position)
  *
  * whenever you call layout.positionZones(), all registered position functions 
  * will be called. the position funcs should position their subcomponent, but 
  * shouldn't resize them (except they will, won't they? because, e.g.,
  * the y axis needs to fit after the x axis grabs some of the vertical space.
  * but as long as left and right regions don't change size horizontally and top
  * and bottom don't change size vertically, only two rounds of positioning
  * will be needed)
  */
export class SvgLayout {
  constructor(w, h, zones) {
    this._w = w;
    this._h = h;
    ['left','right','top','bottom'].forEach(
      zone => this[zone] = _.cloneDeep(zones[zone]));
    this.chart = {};
  }
  svgWidth() {
    return this._w - this.zone(['left','right']);
  }
  chartWidth(...args) {
    return this.svgWidth(...args);
  }
  svgHeight() {
    return this._h - this.zone(['top','bottom']);
  }
  chartHeight(...args) {
    return this.svgHeight(...args);
  }
  w(_w) {
    if (typeof _w !== 'undefined') this._w = _w;
    return this._w;
  }
  h(_h) {
    if (typeof _h !== 'undefined') this._h = _h;
    return this._h;
  }
  zone(zones) {
    zones = typeof zones === "string" ? [zones] : zones;
    var size = _.chain(zones)
                .map(zone=>{
                  var zoneParts = zone.split(/\./);
                  if (zoneParts.length === 1 && this[zoneParts]) {
                    return _.values(this[zoneParts]);
                  }
                  if (zoneParts.length === 2 && this[zoneParts[0]][zoneParts[1]]) {
                    return this[zoneParts[0]][zoneParts[1]];
                  }
                  throw new Error(`invalid zone: ${zone}`);
                })
                .flatten()
                .map(d=>{
                      return d.obj ? d.obj.getBBox()[d.dim] : functor(d.size)();
                })
                .sum()
                .value();
    //console.log(zones, size);
    return size;
  };
  add(zone, componentName, config) {
    return this[zone][componentName] = config;
  }
  positionZones() {
    return _.chain(this)
      .map(_.values)
      .compact()
      .flatten()
      .map('position')
      .compact()
      .each(position=>position(this))
      .value();
  }
}
function functor(val, ...args) { // d3.functor gone in d3.v4
  if (typeof val === "function")
    return val(...args);
  return () => val;
}

export const commify = d3.format(',');





// to help with React reference for sizing
export function getRefsFunc(parent, parentProp, multiple=false, debug=false) {
  return (refs=>{
              if (debug) debugger;
              if (multiple) {
                parent[parentProp]=refs;
              } else {
                let r = _.values(refs);
                if (r.length !== 1)
                  throw new Error("wrong number of refs");
                parent[parentProp]=r[0];
              }
            });
}
export function sendRefsToParent(self, explicit) {
  if (typeof self.props.sendRefsToParent === 'function') {
    self.props.sendRefsToParent(explicit||self.refs);
  }
}
export function getObjectDiff(obj1, obj2) {
    const diff = Object.keys(obj1).reduce((result, key) => {
        if (!obj2.hasOwnProperty(key)) {
            result.push(key);
        } else if (_.isEqual(obj1[key], obj2[key])) {
            const resultKeyIndex = result.indexOf(key);
            result.splice(resultKeyIndex, 1);
        }
        return result;
    }, Object.keys(obj2));

    return diff;
}
export function updateReason(prevProps, prevState, props, state, source) {
  console.log('prevProps', prevProps, '\nthis.props', props, '\n',
                  getObjectDiff(prevProps, props), '\n\n',
              'prevState', prevState, '\nthis.state', state, '\n',
                  getObjectDiff(prevState, state), '\n\n',
              source && 'from ' + source);
}

export function getAncestorWidth(el, selector) {
  let width = Math.round($(el).closest(selector).width());
  if (isNaN(width)) debugger;
  return width;
}
export function setToAncestorWidth(self, el, selector, saveToCompState=true, source='') {
  let width = getAncestorWidth(el, selector);
  if (width && width === self.state.width)
    return width;
  //console.log(`setting ${el.type||el.nodeName}.${el.className} width to ${selector} ancestor. ${$(el).width()} to ${width} ${source && ('from '+source)}`);
  $(el).width(width);
  if (saveToCompState)
    self.setState({width});
  return width;
}
export function getAncestorHeight(el, selector) {
  let height = Math.round($(el).closest(selector).height());
  if (isNaN(height)) debugger;
  return height;
}
export function setToAncestorHeight(self, el, selector, saveToCompState=true, source='') {
  let height = getAncestorHeight(el, selector);
  if (height && height === self.state.height)
    return height;
  //console.log(`setting ${el.type||el.nodeName}.${el.className} height to ${selector} ancestor. ${$(el).height()} to ${height} ${source && ('from '+source)}`);
  $(el).height(height);
  if (saveToCompState)
    self.setState({height});
  return height;
}
export function getAncestorSize(el, selector) {
  return { width:getAncestorWidth(el, selector),
           height:getAncestorHeight(el, selector)
  };
}
export function setToAncestorSize(self, el, selector, saveToCompState=true, source) {
  let width = setToAncestorWidth(self, el, selector, saveToCompState, source);
  let height = setToAncestorHeight(self, el, selector, saveToCompState, source);
  return {width,height}
}

export function firstLastEvent(rxSubj, ms) {
  return (Rx.Observable.merge(rxSubj.debounceTime(ms), rxSubj.throttleTime(ms))
          .distinctUntilChanged());
}
export function cloneToComponentDescendants(children, props) {
  return React.Children.map(children,
          child => {
            if (child.type instanceof Component) {
              return React.cloneElement(child, props);
            } else if (typeof child.type === "string") {
              return React.cloneElement(child, {}, 
                  cloneToComponentDescendants(child.props.children, props));
            } else {
              return child;
            }
          });
}
function findTarget(el) {
  if (el.classList.contains('listener-target'))
    return [ListenerTargetWrapper.targets[el.getAttribute('data-target-id')], el];
  if (el.classList.contains('listener-node'))
    return [null,null];
  if (el.parentNode)
    return findTarget(el.parentNode);
  console.log("can't find target for", el);
}
export class ListenerTargetWrapper extends Component {
  constructor(props) {
    super();
    let addTarget = props.addTarget ||
                      ((self)=>{
                        let id=ListenerTargetWrapper.nextId++;
                        ListenerTargetWrapper.targets[id] = self;
                        return id;
                      });
    this.targetId = addTarget(props.wrappedComponent||this);
  }
  componentDidMount() {
    sendRefsToParent(this);
    this.props.listener && this.props.listener();
  }
  componentDidUpdate() {
    sendRefsToParent(this);
    this.props.listener && this.props.listener();
  }
  render() {
    //const {wrapperTag='g', wrapperProps, children, refFunc=d=>this.elRef=d, className } = this.props;
    const {wrapperTag='g', wrapperProps, children, 
            className } = this.props;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
              //{React.cloneElement(this.props.children, this.props)}
    return  <Tag className={(className||'')+" listener-target"} 
                  ref="listenerTarget"
                  data-target-id={this.targetId} {...wrapperProps}>
              {children}
            </Tag>;
  }
}
ListenerTargetWrapper.nextId = 0;
ListenerTargetWrapper.targets = [];

export class ListenerWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { eventListeners:{}, };
  }
  eventListeners() {
    const {eventsToHandle=[ 'onClick', 'onMouseMove'], 
           eventHandlers=[]} = this.props;
    //console.log('binding ListenerNode to', eventsToHandle);
    const eventListeners = _.fromPairs(
      eventsToHandle.map(
        eventType=> [eventType,this.dispatch.bind(this)]));
    this.setState({eventListeners});
  }
  componentDidMount() {
    this.eventListeners();
    sendRefsToParent(this);
  }
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps.eventsToHandle, this.props.eventsToHandle) ||
        !_.isEqual(prevProps.eventHandlers, this.props.eventHandlers)) {
      this.eventListeners();
    }
    sendRefsToParent(this);
  }
  dispatch(e) {
    const {eventHandlers=[], } = this.props;
    let [target,targetEl] = findTarget(e.target);
    eventHandlers.forEach(eh => eh({e, target, targetEl, listenerWrapper:this}));
  }
  render() {
    const {wrapperTag='g', children, className } = this.props;
    const {eventListeners} = this.state;
    const Tag = wrapperTag; // should be an html or svg tag, i think, not compoent
                //ref={parentWantsRef}>
    return  <Tag className={'listener-node ' + (className||'') } 
                {...eventListeners} 
                ref="listenerNode" >
              {children}
            </Tag>;
  }
}
export class LoadingButton extends Component {
  // not using this yet
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isActive: false
    };
  }
  render() {
    let {loadingMsg='Loading...', bprops} = this.props;
    let {isLoading} = this.state;
    bprops = Object.assign({},
                           {bsStyle:"primary",
                            disabled: isLoading,
                            onClick: !isLoading ? this.handleClick : null,
                           }, bprops);
    return (
      <Button {...bprops} >
        {isLoading ? loadingMsg : this.props.children}
      </Button>
    );
  }
  handleClick() {
    this.setState({isLoading: true});

    // This probably where you would have an `ajax` call
    setTimeout(() => {
      // Completed of async action, set loading state back
      this.setState({isLoading: false});
    }, 2000);
  }
}
