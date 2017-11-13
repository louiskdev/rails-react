/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import { GoogleMapLoader, GoogleMap, Marker } from 'react-google-maps';
import IconClock from 'material-ui/svg-icons/device/access-time';
import IconPlace from 'material-ui/svg-icons/maps/place';
import IconDescription from 'material-ui/svg-icons/action/description';
import IconPeople from 'material-ui/svg-icons/social/people';

class Event extends Component {

  state = {
    latlng: null,
  }

  googleMap = (mapHeight) => {
    const { latlng } = this.state;
    if (!latlng) {
      return '';
    }
    const point = {
      lat: latlng.lat(),
      lng: latlng.lng(),
    };
    return (
      <GoogleMapLoader
        containerElement={
          <div style={{ height: mapHeight }} />
        }
        googleMapElement={
          <GoogleMap
            defaultZoom={17}
            defaultCenter={point}>
            <Marker
              position={{
                lat: latlng.lat(),
                lng: latlng.lng(),
              }}
              key='Event'
              defaultAnimation={2} />
          </GoogleMap>
        } />
    );
  }

  formatDateTime = (date) => {
    const _date = new Date(date);
    const month = _date.getMonth() + 1;
    let dstr = '';
    dstr = dstr + _date.getFullYear() + '-';
    dstr = dstr + (month < 10 ? '0' : '') + month + '-';
    dstr = dstr + (_date.getDate() < 10 ? '0' : '') + _date.getDate() + ' ';
    const h = _date.getHours() % 12;
    dstr = dstr + ' at ' + (h < 10 ? '0' : '') + h + ':00 ';
    const h_am_pm = _date.getHours() < 12 ? 'AM' : 'PM';
    dstr = dstr + h_am_pm;
    return dstr;
  }

  componentWillMount() {
    const { event } = this.props;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': event.address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && status !== google.maps.GeocoderStatus.ZERO_RESULTS) {
        this.setState({
          latlng: results[0].geometry.location,
        });
      }
    });
  }

  render() {
    const avatarSize = 100;
    const mapHeight = 250;
    const mapPlaceholderStyle = {
      height: mapHeight,
      background: '#f0f0f1',
    };
    const iconStyle = {
      verticalAlign: '-30%',
      marginRight: 6,
    };
    const { event } = this.props;
    const { latlng } = this.state;
    return (
      <div className='event-page'>
        {
          latlng ?
          this.googleMap(mapHeight)
          :
          <div style={mapPlaceholderStyle} />
        }
        <div className='event-info'>
          <div className='event-image-title'>
            <img src={event.avatar_url} />
            <h1>{event.name}</h1>
          </div>
          <div className='event-summary'>
            <div>
              <h3><IconClock style={iconStyle}/>Date</h3>
              {this.formatDateTime(event.start_date)}
            </div>
            <div className='divider' />
            <div>
              <h3><IconPlace style={iconStyle}/>Location</h3>
              {event.address}
            </div>
          </div>
        </div>
        <div className='event-description'>
          <h3><IconDescription style={iconStyle}/>Description</h3>
          {event.description}
        </div>
        <div className='event-participants'>
          <h3><IconPeople style={iconStyle}/>Participants</h3>
          <div>
            {event.members.edges.map((member, i) => (
              <Link key={i} to={`/u/${member.username ? member.username : member.node.username}`}>
                <img src={member.avatar_url ? member.avatar_url : member.node.avatar_url} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

}

export default Event;
