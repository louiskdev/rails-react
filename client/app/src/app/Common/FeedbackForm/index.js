import React, { Component } from 'react';
import { Form as FormsyForm } from 'formsy-react';
import FormText from '@common/form_text';
import RaisedButton from 'material-ui/RaisedButton';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import Slider from 'material-ui/Slider';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Checkbox from 'material-ui/Checkbox';
import superagent from 'superagent';
import { notify } from 'react-notify-toast';

class FeedbackForm extends Component {

  state = {
    useAnotherSocialToggle: false,
    canSubmit: false,
    ignorePristine: false,
    score: 0,
  }

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      // event.preventDefault();
    }
  }

  enableButton = () => {
    this.setState({
      canSubmit: true,
    });
  }

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  }

  handleAnotherSocialToggleChange = (e, checked) => {
    this.setState({
      useAnotherSocialToggle: checked,
    });
  }

  handleSliderChange = () => {
    const score = this.refs.scoreSlider.state.value;
    this.setState({
      score,
    });
  }

  submitForm = () => {
    const data = {
      use_another_social: this.state.useAnotherSocialToggle,
      use_another_social_period: this.refs.useAnotherSocialTime ? this.refs.useAnotherSocialTime.state.selected : '',
      score: this.refs.scoreSlider.state.value,
      content: this.refs.content ? this.refs.content.state.value : '',
    };
    this.disableButton();
    const request = superagent.post('/api/v1/feedback');
    const token = window.localStorage.getItem('mbubblz_token');
    const clientID = window.localStorage.getItem('mbubblz_client_id');
    request.set('Accept', 'application/json');
    request.set('Content-Type', 'application/json');
    request.set('authorization', token);
    request.set('Client-ID', clientID);
    request.send(data);
    request.end((err, res) => {
      this.enableButton();
      if (err) {
        notify.show('Failed to save feedback', 'error', 2000);
      }
      else {
        notify.show('Your feedback saved successfully!', 'success', 2000);
        if (this.props.onSubmit) {
          this.props.onSubmit();
        }
      }
    });
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  render() {
    const containerStyle = {
      padding: '20px 0 30px',
    };
    const h2Style = {
      color: 'rgba(0, 0, 0, 0.870588)',
      fontWeight: 'normal',
      marginBottom: 25,
    };
    const textStyle = {
      width: '100%',
    };
    const inputStyle = {
      border: '1px solid #dfdfdf',
      borderRadius: '4px',
      padding: '18px 0 0 18px',
      height: '56px',
      marginTop: '0',
    };
    const textareaStyle = {
      border: '1px solid #dfdfdf',
      borderRadius: '4px',
      padding: '18px 0 0 18px',
      appearance: 'none',
    };
    const labelStyle = {
      paddingLeft: '25px',
      fontSize: '15px',
      top: '18px',
    };
    const labelFocusStyle = {
      top: '30px',
    };
    const errorStyle = {
      textAlign: 'left',
      position: 'static',
      bottom: '0',
      paddingLeft: '0',
      marginTop: '5px',
    };
    const submitButtonContainerStyle = {
      textAlign: 'center',
    };
    const submitButtonStyle = {
      height: '48px',
      margin: '30px auto 0',
    };
    const submitButtonLabelStyle = {
      fontSize: '1.2em',
      textTransform: 'none',
      padding: '0px 30px',
      lineHeight: '50px',
    };
    const toggleStyle = {
      marginBottom: 30,
    };
    const radioGroupStyle = {
      marginBottom: 40,
    };
    const radioStyle = {
      marginBottom: 8,
    };
    const labelStyle2 = {
      color: 'rgba(0, 0, 0, 0.870588)',
    };
    const labelTimeStyle = {
      display: 'block',
      marginBottom: 15,
      ...labelStyle2,
    };

    const { useAnotherSocialToggle, canSubmit, ignorePristine, score } = this.state;

    const scoreColor = score >= 0 ? '#5ed28f' : '#ff4081';
    const muiSliderTheme = getMuiTheme({
      slider: {
        trackColor: scoreColor,
        selectionColor: scoreColor,
      },
    });

    return (
      <div style={containerStyle}>
        <h2 style={h2Style}>Please provide your feedback</h2>
        <FormsyForm
          onKeyPress={this.onKeyPress}
          onValid={this.enableButton}
          onInvalid={this.disableButton}
          onValidSubmit={this.submitForm}
          onInvalidSubmit={this.onInvalidFormSubmit}
          noValidate
        >
          <Checkbox
            label='Do you use another Social Networking site?'
            defaultChecked={false}
            style={toggleStyle}
            onCheck={this.handleAnotherSocialToggleChange} />
          {
            useAnotherSocialToggle ?
            <div style={radioGroupStyle}>
              <label style={labelTimeStyle}>If so, how much time a day do you usually spend on other social networking sites?</label>
              <RadioButtonGroup
                name='useAnotherSocialTime'
                ref='useAnotherSocialTime'
                defaultSelected='lt_30min'>
                <RadioButton
                  value='lt_30min'
                  label='Less than 30 minutes'
                  style={radioStyle} />
                <RadioButton
                  value='30m_1h'
                  label='30 minutes to an hour'
                  style={radioStyle} />
                <RadioButton
                  value='gt_1h'
                  label='More than an hour'
                  style={radioStyle} />
              </RadioButtonGroup>
            </div>
            :
            undefined
          }
          <label>Rate your experience with us: <strong style={{ color: scoreColor }}>{score}</strong></label><br/>
          <MuiThemeProvider muiTheme={muiSliderTheme}>
            <Slider
              name='feedbackScore'
              ref='scoreSlider'
              max={10}
              min={-10}
              step={1}
              value={score}
              onChange={this.handleSliderChange}
              sliderStyle={{ marginTop: 10, marginBottom: 40 }} />
          </MuiThemeProvider>
          <FormText
            name='feedbackContent'
            ref='content'
            floatingLabelText='Feedback content'
            className='form-text-multi-line'
            multiLine
            rows={3}
            underlineShow={false}
            inputStyle={textareaStyle}
            floatingLabelStyle={labelStyle}
            floatingLabelFocusStyle={labelFocusStyle}
            errorStyle={errorStyle}
            style={textStyle}
            required
            requiredError='Please enter the feedback content'
            ignorePristine={ignorePristine} />
          <div style={submitButtonContainerStyle}>
            <RaisedButton
              backgroundColor='#61D894'
              label='Submit Feedback'
              labelColor='#FFFFFF'
              labelStyle={submitButtonLabelStyle}
              style={submitButtonStyle}
              onClick={this.submitForm}
            />
          </div>
        </FormsyForm>
      </div>
    );
  }

}

export default FeedbackForm;
