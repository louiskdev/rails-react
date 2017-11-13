/* @flow */
/* eslint-disable max-len */

import React from 'react';
import Formsy from 'formsy-react';
import TextField from 'material-ui/TextField';

const FormText = React.createClass({

  propTypes: {
    defaultValue: React.PropTypes.any,
    name: React.PropTypes.string.isRequired,
    onBlur: React.PropTypes.func,
    onChange: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    value: React.PropTypes.any,
    required: React.PropTypes.bool,
    requiredError: React.PropTypes.string,
    ignorePristine: React.PropTypes.bool,
    forcedError: React.PropTypes.string,
  },

  mixins: [Formsy.Mixin],

  getInitialState() {
    return {
      pristine: true,
      showErrorBorder: false,
      value: this.props.defaultValue || this.props.value || '',
    };
  },

  componentWillMount() {
    this.setValue(this.props.defaultValue || this.props.value || '');
  },

  handleBlur: function handleBlur(event) {
    /*this.setState({
      pristine: false
    });*/
    this.setValue(event.currentTarget.value);
    if (this.props.onBlur) this.props.onBlur(event);
  },

  handleChange: function handleChange(event) {
    this.setState({
      pristine: false,
      value: event.currentTarget.value,
    });
    if (this.props.onChange) this.props.onChange(event);
  },

  handleKeyDown: function handleKeyDown(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13) this.setValue(event.currentTarget.value);
    if (this.props.onKeyDown) this.props.onKeyDown(event, event.currentTarget.value);
  },

  getValidationError: function getValidationError() {
    const {
      forcedError,
      ignorePristine,
      required,
      requiredError,
    } = this.props;
    if (forcedError) {
      return forcedError;
    }
    if ((ignorePristine || !this.state.pristine) && required && !this.state.value) {
      return requiredError;
    }
    return this.getErrorMessage();
  },

  render() {
    const {
      className,
      onFocus,
      defaultValue, // eslint-disable-line no-unused-vars
      value, // eslint-disable-line no-unused-vars
      ignorePristine, // eslint-disable-line no-unused-vars
      requiredError, // eslint-disable-line no-unused-vars
      validations, // eslint-disable-line no-unused-vars
      validationError, // eslint-disable-line no-unused-vars
      validationErrors, // eslint-disable-line no-unused-vars
      forcedError, // eslint-disable-line no-unused-vars
      ...rest } = this.props;
    return (
      <TextField
        {...rest}
        ref='textField'
        className={'myb-form-text' + (this.getValidationError() ? ' errorBorder' : '') + (!this.state.pristine && !this.getValidationError() ? ' successBorder' : '') + (className ? ' ' + className : '')}
        errorText={this.getValidationError()}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={onFocus}
        onKeyDown={this.handleKeyDown}
        value={this.state.value}
        textareaStyle={this.props.multiLine ? { marginTop: 10, marginBottom: 0 } : {}}
      />
    );
  },
});

export default FormText;
