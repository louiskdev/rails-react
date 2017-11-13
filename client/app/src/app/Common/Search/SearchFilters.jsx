/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import debounce from 'lodash.debounce';
import Slider from 'material-ui/Slider';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import IconButton from 'material-ui/IconButton';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import transitions from 'material-ui/styles/transitions';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import FormText from '@common/form_text';
import CommonStyles from '@utils/CommonStyles';

class SearchFilters extends Component {
  constructor(props) {
    super(props);
    this.state = {
      draggingSlider: false,
      rateSliderValue: this.props.rateSliderValue,
      expand: false,
    };
  }

  changeZipcode = (event) => {
    event.persist();
    this.delayedChangeZipcode(event);
  }

  delayedChangeZipcode = debounce((event) => {
    this.props.setZipCode(event.target.value);
    this.props.search();
  }, 500);

  onRateChangeStart = () => {
    this.setState({
      draggingSlider: true,
      rateSliderValue: this.refs.rateSlider.state.value,
    });
  }

  onRateSliding = () => {
    this.setState({
      rateSliderValue: this.refs.rateSlider.state.value,
    });
  }

  onRateChange = () => {
    const newRadius = this.refs.rateSlider.state.value;

    this.setState({
      draggingSlider: false,
    });

    this.props.setRadius(newRadius);
    this.props.search();
  }

  handleTouchTap = () => {
    this.setState({
      expand: !this.state.expand,
    });
  };

  render() {
    const rateColor = '#62db95';

    const muiSliderTheme = getMuiTheme({
      slider: {
        trackColor: rateColor,
        selectionColor: rateColor,
      },
    });

    const codeBlockTitle = {
      cursor: 'pointer',
    };

    const styles = {
      markdown: {
        overflow: 'auto',
        maxHeight: 1400,
        transition: transitions.create('max-height', '200ms', '0ms', 'ease-in-out'),
        marginTop: 0,
        marginBottom: 0,
        width: '100%',
      },
      markdownRetracted: {
        maxHeight: 0,
      },
    };

    let codeStyle = Object.assign({}, styles.markdown, styles.markdownRetracted);

    if (this.state.expand) {
      codeStyle = styles.markdown;
    }

    return (
      <div className="search-filters-panel">
        <div onTouchTap={this.handleTouchTap} style={codeBlockTitle}>
          <Toolbar style={{...CommonStyles.filters.toolbar, justifyContent: 'flex-start', borderBottom: '1px solid #f1f1f1'}}>
            <ToolbarGroup>
              <IconButton touch style={CommonStyles.filters.icon}>
                <NavigationExpandMoreIcon />
              </IconButton>
              <ToolbarTitle text='Filters' style={CommonStyles.filters.title} />
            </ToolbarGroup>
          </Toolbar>
        </div>
        <div className="filters-block" style={codeStyle}>
          <div className="filters-block-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0px 0px 16px',
            }}
          >
            {/*<span className="search-actions">
              <a
                className={this.props.activeSearch === 'people' ? 'active' : ''}
                onClick={() => this.props.toggleSearch('people')}
              >
                People
              </a>
              <a
                className={this.props.activeSearch === 'bubblz' ? 'active' : ''}
                onClick={() => this.props.toggleSearch('bubblz')}
              >
                Bubblz
              </a>
            </span>*/}

            <FormText
              className="zip_code"
              name="zip_code"
              defaultValue={this.props.zip_code}
              validations="isAlphanumeric"
              validationError="Invalid zipcode or location"
              floatingLabelText="Zipcode or location"
              onChange={this.changeZipcode}
              style={{ ...CommonStyles.outside.textStyle, maxWidth: '75%', marginBottom: 0 }}
              underlineShow={false}
              inputStyle={{ ...CommonStyles.outside.inputStyle, height: 44, maxWidth: '75%', padding: '8px 0px 0px 12px' }}
              floatingLabelStyle={{ ...CommonStyles.outside.labelStyle, paddingLeft: 16, lineHeight: '40px', fontSize: '12px' }}
              floatingLabelFocusStyle={{ ...CommonStyles.outside.labelFocusStyle }}
              errorStyle={CommonStyles.outside.errorStyle}
            />

            <div className="search-radius" onClick={(e) => e.stopPropagation()}>
              <span className="search-radius-text">Radius</span>
              <span className="search-radius-slider">
                <MuiThemeProvider muiTheme={muiSliderTheme}>
                  <Slider
                    ref='rateSlider'
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={this.props.radius}
                    value={this.state.rateSliderValue}
                    sliderStyle={{ margin: 0, top: 3 }}
                    onDragStart={this.onRateChangeStart}
                    onDragStop={this.onRateChange}
                    onChange={this.onRateSliding}
                  />
                </MuiThemeProvider>
              </span>
              <span className="search-radius-number">{this.state.rateSliderValue}&nbsp;mi</span>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

SearchFilters.propTypes = {
  activeSearch: React.PropTypes.string,
  search: React.PropTypes.func,
  toggleSearch: React.PropTypes.func,
  rateSliderValue: React.PropTypes.number,
  zip_code: React.PropTypes.string,
  radius: React.PropTypes.number,
  setZipCode: React.PropTypes.func,
  setRadius: React.PropTypes.func,
};

export default SearchFilters;
