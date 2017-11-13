/* @flow */
/* eslint-disable max-len */


import React from 'react';
import Formsy from 'formsy-react';
import SelectField from 'material-ui/SelectField';

const FormSelect = React.createClass({

  propTypes: {
    children: React.PropTypes.node,
    name: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func,
    value: React.PropTypes.any,
    required: React.PropTypes.bool,
    requiredError: React.PropTypes.string,
    ignorePristine: React.PropTypes.bool,
  },

  mixins: [Formsy.Mixin],

  getInitialState() {
    return {
      hasChanged: false,
    };
  },

  handleChange(event, index, value) {
    this.setValue(value);

    this.setState({
      hasChanged: value !== '',
    });

    if (this.props.onChange) this.props.onChange(event, value, index);
  },

  getValidationError: function getValidationError() {
    const {
      ignorePristine,
      required,
      requiredError,
    } = this.props;
    let value = this.props.value;
    value = this.state.hasChanged ? this.getValue() : value;
    if (ignorePristine && required && !value) {
      return requiredError;
    }
    return this.getErrorMessage();
  },

  render() {
    let {
      value,
      className,
      ignorePristine, // eslint-disable-line no-unused-vars
      requiredError, // eslint-disable-line no-unused-vars
      validations, // eslint-disable-line no-unused-vars
      validationError, // eslint-disable-line no-unused-vars
      validationErrors, // eslint-disable-line no-unused-vars
      ...rest
    } = this.props;
    value = this.state.hasChanged ? this.getValue() : value;

    return (
      <SelectField
        {...rest}
        className={'myb-form-select' + (this.state.pristine ? ' errorBorderSelect' : '') + (className ? ' ' + className : '')}
        errorText={this.getValidationError()}
        onChange={this.handleChange}
        value={value}
      >
        {this.props.children}
      </SelectField>
    );
  },
});

export default FormSelect;
