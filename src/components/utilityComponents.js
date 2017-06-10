
import React, { Component } from 'react'

import RaisedButton from 'material-ui/RaisedButton';

export const SaveButton = props => {
  const {buttonProps, children} = props
  return  <RaisedButton
              backgroundColor='#5cb85c' // btn-success
              color='white'
              label='SAVE'
              {...buttonProps} >
            {children}
          </RaisedButton>
}
