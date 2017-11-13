/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
/*import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import FormsyText from 'formsy-material-ui/lib/FormsyText';
import CommonStyles from '@utils/CommonStyles';*/
import { Link } from 'react-router';
import ArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';

import { withApollo } from 'react-apollo';
import About from '../../components/About';

class HelpCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  /*enableButton = () => {
    this.setState({
      canSubmit: true,
    });
  }

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  }

  submitForm = (data) => {
    const email = data.email;
    this.setState({
      formBackground: '#FFFFFF',
    });
    this.props.client.mutate({
      mutation: gql`
        mutation sendNewUserConfirmationEmail($email: String!) {
          sendConfirmationEmail(input: {email: $email }) {
            email
          }
        }
      `,
      variables: {
        email: email,
      },
    }).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error', 2000);
      }
      else {
        notify.show('Awesome! You have registered successfully, Please, check email inbox', 'success', 3000);
        ReactGA.event({
          category: 'User',
          action: 'Signed up',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  notifyFormError = (data) => {
    this.setState({
      formBackground: '#F5B5B2',
    });
  }*/

  render() {

    let helpPage = <About />;
    /*if (this.props.params.help_page === 'dashboard') {
      helpPage = <Dashboard />
    }
    if (this.props.params.help_page === 'bubbles') {
      helpPage = <Bubbles />
    }
    else if (this.props.params.help_page === 'help') {
      helpPage = <Help />
    }
    else if (this.props.params.help_page === 'mobile') {
      helpPage = <Mobile />
    }*/

    const signButtonStyle = {
      float: 'right',
      height: '48px',
      margin: '5px',
    };

    return (
    <div className='help-center'>
      <div className="help-center-search">
        <div className="help-center-search-inner">
          <h1>Help and Support</h1>
          {/*<FormsyForm
            onValid={this.enableButton}
            onInvalid={this.disableButton}
            onValidSubmit={this.submitForm}
            onInvalidSubmit={this.notifyFormError}
            noValidate
            autoComplete='off'
          >
            <FormsyText
              className='form-signup-email'
              name='search'
              hintText='Search keyword'
              hintStyle={{ fontSize: '17px' }}
              style={CommonStyles.outside.emailAddressStyle}
              onChange={this.handleTyping}
              value={this.state.userEmail}
              onKeyUp={this.handleChangeUserEmail}
              underlineShow={false}
              required
            />
            <FlatButton
              backgroundColor={CommonStyles.outside.buttonBackgroundColor}
              className='form-signup-button'
              hoverColor={CommonStyles.outside.buttonHoverColor}
              label='Search'
              labelStyle={CommonStyles.outside.signButtonLabelStyle}
              style={signButtonStyle}
              type='submit'
              formNoValidate
            />
          </FormsyForm>*/}
        </div>
      </div>
      {!this.props.params.help_page ?
        <div className="help-center-inner">
          {helpPage}
        </div>
        :
        <div className="help-center-inner">
          <HelpSidebar />
          {helpPage}
        </div>
      }
      <div className='app-menu-expand help-page-logo'>
        <Link to='/' className={ this.props.location.pathname.indexOf('help') > -1 ? 'app-menubar-item app-logo help-back-to' : 'app-menubar-item app-logo'}>
          <ArrowLeft color="rgba(255, 255, 255, 0.7)" style={{ width: 44, height: 44 }}/>
        </Link>
      </div>
    </div>
    );
  }

}

export default withApollo(HelpCenter);
