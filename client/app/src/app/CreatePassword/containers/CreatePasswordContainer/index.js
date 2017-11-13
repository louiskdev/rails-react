/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FormsyCheckbox from 'formsy-material-ui/lib/FormsyCheckbox';
import gql from 'graphql-tag';

import FormText from '@common/form_text';
import CommonStyles from '@utils/CommonStyles';
import TOS from '@common/StaticPages/TOS';
import { withApollo } from 'react-apollo';

class CreatePasswordContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      canSubmit: false,
      isSmallScreen: $(window).width() < 600,
      ignorePristine: false,
      passwordError: '',
      confirmPasswordError: '',
      isAgreed: false,
      openTerms: false,
      openPrivacy: false,
      loadingState: false,
    };

    const self = this;
    $(window).resize(function() {
      self.updateScreen();
    });

  }

  updateScreen = () => {
    this.setState({
      isSmallScreen: $(window).width() < 600,
    });
  }

  enableButton = () => {
    if (this.state.isAgreed) {
      this.setState({
        canSubmit: true,
      });
    }
  }

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  }

  checkPassword(password, password_confirmation) {
    if (password !== password_confirmation) {
      this.setState({
        passwordError: 'You must enter the same password in both text fields',
        confirmPasswordError: 'You must enter the same password in both text fields',
      });
      return false;
    }
    if (!password || password.length < 6) {
      this.setState({
        passwordError: 'Password is too short (minimum is 6 characters)',
        confirmPasswordError: '',
      });
      return false;
    }
    return true;
  }

  handleDialogOpen = (dialogId) => {
    if (dialogId === 'terms') {
      this.setState({
        openTerms: true,
      });
    }
    else {
      this.setState({
        openPrivacy: true,
      });
    }
  }

  handleDialogClose = (dialogId) => {
    if (dialogId === 'terms') {
      this.setState({
        openTerms: false,
      });
    }
    else {
      this.setState({
        openPrivacy: false,
      });
    }
  }

  handleCheckedAgreeToTerms = () => {
    this.setState({
      isAgreed: !this.state.isAgreed,
    });
  }

  submitForm = (data) => {
    const self = this;

    const token = localStorage.getItem('mbubblz_token');
    const password = data.password;
    const password_confirmation = data.password_confirmation;
    const agree_to_terms = data.agree_to_terms ? '1' : '0';

    if (!this.checkPassword(password, password_confirmation)) {
      return;
    }

    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
      mutation updateUserPassword($password: String!, $password_confirmation: String!, $agree_to_terms: String!) {
        completeAccount(input: {
          password: $password,
          password_confirmation: $password_confirmation,
          agree_to_terms: $agree_to_terms
        }) {
          user {
            access_token
            client_id
            id
            username
            avatar_url(version: "micro")
            interests {
              edges {
                node {
                  name
                  id
                }
              }
            }
            first_name
            gender
            language
            birthday
            zip_code
          }
        }
      }
      `,
      variables: {
        password_confirmation: password_confirmation,
        password: password,
        agree_to_terms: agree_to_terms,
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
        self.setState({
          loadingState: false,
        });
        self.props.router.push('/signin');
      }
      else {
        localStorage.setItem('mbubblz_token', data.completeAccount.user.access_token);
        localStorage.setItem('mbubblz_client_id', data.completeAccount.user.client_id);
        localStorage.setItem('mbubblz_user', JSON.stringify(data.completeAccount.user));
        setTimeout(() => {
          self.setState({
            loadingState: false,
          });
          self.props.router.push('/');
        }, 1000);
      }

    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  clearPasswordError = () => {
    this.setState({
      passwordError: '',
      confirmPasswordError: '',
    });
  }

  render() {

    const checkBoxText = <span className='terms_links'>
      I agree to the <a onClick={this.handleDialogOpen.bind(this, 'terms')} style={{ zIndex: 10 }}>Terms & Conditions</a>
    </span>;

    const {
      ignorePristine,
      passwordError,
      confirmPasswordError,
    } = this.state;

    const user = localStorage.getItem('mbubblz_username') !== '' ? localStorage.getItem('mbubblz_username') : '';

    return (
      <div className='greenbg'>
        <div className='container'>
          <div className='create-password-wrapper'>
              <Link to='/' className='app-menubar-item app-logo logo'>
                <span className='app-logo-wrapper'>
                  <span className='app-logo-text'>z</span>
                </span>
              </Link>
              <div className='form-complete-profile'>
              <FormsyForm
                onValid={this.enableButton}
                onInvalid={this.disableButton}
                onValidSubmit={this.submitForm}
                onInvalidSubmit={this.onInvalidFormSubmit}
                noValidate
                autoComplete='off'
              >
                <Paper style={CommonStyles.outside.paperStyle} zDepth={0} rounded={false} className='user-fields-paper'>
                  <FormText
                    name='username'
                    defaultValue={user.username}
                    floatingLabelText='Username'
                    style={{ display: 'none' }}
                    underlineShow={false}
                    inputStyle={CommonStyles.outside.inputStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    type='text'
                    requiredError='Enter a valid username'
                    ignorePristine={ignorePristine}
                    forcedError={passwordError}
                    onChange={this.clearPasswordError}
                  />
                  <FormText
                    name='password'
                    floatingLabelText='Password'
                    style={CommonStyles.outside.textStyle}
                    underlineShow={false}
                    inputStyle={CommonStyles.outside.inputStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    type='password'
                    required
                    requiredError='Enter a valid password'
                    ignorePristine={ignorePristine}
                    forcedError={passwordError}
                    onChange={this.clearPasswordError}
                  />
                  <FormText
                    name='password_confirmation'
                    floatingLabelText='Repeat password'
                    style={CommonStyles.outside.textStyle}
                    underlineShow={false}
                    inputStyle={CommonStyles.outside.inputStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    type='password'
                    required
                    requiredError='Enter a valid password'
                    ignorePristine={ignorePristine}
                    forcedError={confirmPasswordError}
                    onChange={this.clearPasswordError}
                  />
                <FormsyCheckbox
                  name='agree_to_terms'
                  label={checkBoxText}
                  labelStyle={{ ...CommonStyles.checkbox.labelColor, zIndex: 100 }}
                  iconStyle={CommonStyles.checkbox.iconColor}
                  inputStyle={CommonStyles.checkbox.inputColor}
                  style={CommonStyles.checkbox.style}
                  onClick={this.handleCheckedAgreeToTerms}
                  required
                />
                <RaisedButton
                  fullWidth={!!this.state.isSmallScreen}
                  backgroundColor={this.state.isAgreed ? CommonStyles.outside.buttonBackgroundColor : '#E5E5E5'}
                  label={ this.state.loadingState ? <div className='loader-wrapper'><div className='loader' /></div> : 'Finish'}
                  labelColor={CommonStyles.outside.buttonLabelColor}
                  labelStyle={CommonStyles.outside.signButtonLabelStyle}
                  style={CommonStyles.outside.signButtonStyle}
                  type='submit'
                  disabled={!this.state.isAgreed}
                  formNoValidate
                />
                </Paper>
              </FormsyForm>
              <Dialog
                actions={[
                  <FlatButton
                    label='OK'
                    primary
                    onTouchTap={this.handleDialogClose.bind(this, 'terms')}
                  />,
                ]}
                modal={false}
                autoScrollBodyContent
                open={this.state.openTerms}
                onRequestClose={this.handleDialogClose.bind(this, 'terms')}
              >
                <TOS className='dialog'/>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default withApollo(CreatePasswordContainer);
