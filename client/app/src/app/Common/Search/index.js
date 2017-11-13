/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import { notify } from 'react-notify-toast';
import { Link, withRouter } from 'react-router';
import Popover from 'material-ui/Popover';
import { Form as FormsyForm } from 'formsy-react';
import IconActionSearch from 'material-ui/svg-icons/action/search';
import AutoComplete from 'material-ui/AutoComplete';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Chip from 'material-ui/Chip';
import debounce from 'lodash.debounce';
import { withApollo } from 'react-apollo';

import gql from 'graphql-tag';

import SearchItem from './SearchItem';
import SearchFilters from './SearchFilters';

class Search extends Component {

  constructor(props) {
    super(props);
    this.state = {
      anchorEl: {},
      stopSearch: false,
      ignorePristine: false,
      selectedUsers: true,
      selectedBubbles: false,
      searchText: '',
      tempDataSource: [],
      keywords: [],
      zip_code: '', // JSON.parse(localStorage.getItem('mbubblz_user')).zip_code,//this.props.searchKeyword ? JSON.parse(localStorage.getItem('mbubblz_user')).zip_code : '',
      radius: 0,
      users: null,
      bubbles: null,
      open: false,
      activeSearch: false,
      keywordRemoved: false,
      search_by: 'people',
      suggestSearch: false,
    };
  }

  componentDidMount = () => {
    const self = this;
    $(document).mouseup(function(e) {
      const container = $('.search-wrapper-popover.open');
      const searchInput = $('.search-field input');

      if (!container.is(e.target) // if the target of the click isn't the container...
          && container.has(e.target).length === 0 // ... nor a descendant of the container
          && !searchInput.is(e.target)
        ) {
        if (self.state.open && !self.state.keywordRemoved) {
          self.setState({
            open: false,
            activeSearch: false,
            keywords: [],
            users: null,
            bubbles: null,
            searchText: '',
            tempDataSource: [],
            suggestSearch: false,
          });
          self.props.changeSearchKeyword('')
        }
        if (self.state.keywordRemoved) {
          self.setState({
            keywordRemoved: false,
            keywords: [],
            users: null,
            bubbles: null,
            searchText: '',
            tempDataSource: [],
            suggestSearch: false,
          });
        }
      }
    });
    this.onMount();
  }

  componentWillReceiveProps(nextProps) {
     // Duplicate search keywords && this.props.searchKeyword !== nextProps.searchKeyword
    if (nextProps.searchKeyword) {
      this.setState({
        open: true,
        searchText: nextProps.searchKeyword || '',
        radius: 0,
        zip_code: '',
        keywords: [],
      });
      this.handleUpdateKeywords(nextProps.searchKeyword);
      // this.searchUsersBubbles();
    }
  }

  onMount = () => {
    this.setState({
      anchorEl: ReactDOM.findDOMNode(this.refs.select_keywords),
    });
  }

  filterKeywords = (searchText, key) => {
    if (searchText === '') {
      return true;
    }
    else {
      return key.indexOf(searchText) !== -1;
    }
  };

  handleUpdateKeywords = debounce((value, suggestion = false) => {
    if (!value) {
      this.setState({
        open: false,
      });
      return;
    }

    const autoComplete = this.refs.select_keywords;
    setTimeout(() => {
      autoComplete && autoComplete.setState({ searchText: '' });
    }, 100);

    const newKeyword = {
      key: this.state.keywords.length + 1,
      label: value,
    };
    const keywords = this.state.keywords.filter((item) => (
      item.label !== value
    ));
    keywords.push(newKeyword);

    this.setState({
      keywords: keywords,
      tempDataSource: [],
    });

    this.searchUsersBubbles();
  }, 100);

  onKeyPress = (event) => {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  onKeyPressAutoField = (event) => {
    if (event.which === 13 && this.state.searchText === '') {
      this.handleUpdateKeywords(this.state.tempDataSource[0]);
    }
    else if (event.which === 44 || event.which === 13) {
      this.handleUpdateKeywords(this.state.searchText);
    }
  }

  handleOnPaste = (value) => {
    this.setState({
      searchText: value,
    });
    this.handleUpdateKeywords(value);
  };

  handleUpdateCustomKeywords = (value) => {
    this.setState({
      searchText: value,
    });
    const zip_code = this.state.zip_code;
    const radius = this.state.radius;
    this.searchUsers(value, zip_code, radius, true);
    this.searchBubbles(value, zip_code, radius, true);
  };

  handleDeleteKeyword = (key) => {
    const keywords = this.state.keywords.filter((item) => (
      item.key !== key
    ));

    if (keywords.length === 0) {
      this.setState({
        keywords: [],
        tempDataSource: [],
        keywordRemoved: true,
        users: [],
        bubbles: [],
      });
    }
    else {
      this.setState({
        keywords: keywords,
        tempDataSource: [],
        keywordRemoved: true,
      });
      this.searchUsersBubbles(keywords, false);
    }
  };

  renderKeyword = (data) => (
    <Chip
      className='tag'
      key={data.key}
      onRequestDelete={() => this.handleDeleteKeyword(data.key)}
      labelStyle={{ fontSize: 12, lineHeight: '26px', paddingLeft: '8px' }}
      style={{ margin: '0 2px', borderRadius: '4px', border: '4px' }}
    >
      {data.label}
    </Chip>
  )

  searchUsers = (keywords, zip_code, radius, suggestion) => {
    const self = this;
    this.setState({
      suggestSearch: suggestion,
    });

    let query = gql`
      query searchUsers($first: Int!, $keywords: [String]!, $zip_code: String!, $radius: Int!) {
        findUsers(first: $first, keywords: $keywords, zip_code: $zip_code, radius: $radius) {
          edges {
            node {
              id
              username
              avatar_url(version: "micro")
              gender
              zip_code
              birthday
              friends_count
              friendship_status
            }
          }
        }
      }
    `;

    let vars = {
      first: 5,
      keywords: keywords.length > 0 ? keywords : [''],
      zip_code: zip_code,
      radius: parseInt(radius, 10),
    }

    /*if (suggestion) {
      query = gql`
        query suggestUsers($first: Int!, $keyword: String!) {
          suggestUsers(first: $first, keyword: $keyword) {
            edges {
              node {
                id
                username
                avatar_url(version: "micro")
                gender
                zip_code
                birthday
                friends_count
                friendship_status
              }
            }
          }
        }
      `;

      vars = {
        first: 5,
        keyword: keywords.length > 0 ? keywords : '',
      }
    }*/

    this.props.client.query({
      query: query,
      variables: vars,
      forceFetch: true,
      activeCache: false,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      this.setState({
        searchingState: false,
      });

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        this.setState({
          users: data.suggestUsers ? data.suggestUsers.edges : data.findUsers.edges,
          stopSearch: true,
          open: true,
        });
      }
    }).catch((error) => {
      self.setState({
        searchingState: false,
      });
      notify.show(error.message, 'error', 2000);
    });
  }

  searchBubbles = (keywords, zip_code, radius, suggestion) => {
    const self = this;
    this.setState({
      suggestSearch: suggestion,
    });
    let query = gql`
      query searchBubbles($first: Int!, $keywords: [String]!, $zip_code: String!, $radius: Int!) {
        findBubbles(first: $first, keywords: $keywords, zip_code: $zip_code, radius: $radius) {
          edges {
            node {
              permalink
              avatar_url(version: "micro")
              description
              name
              members_count
            }
          }
        }
      }
    `;

    let vars = {
      first: 5,
      keywords: keywords.length > 0 ? keywords : [''],
      zip_code: zip_code,
      radius: parseInt(radius, 10),
    }

    /*if (suggestion) {
      query = gql`
        query suggestBubbles($first: Int!, $keyword: String!) {
          suggestBubbles(first: $first, keyword: $keyword) {
            edges {
              node {
                permalink
                avatar_url(version: "micro")
                description
                name
                members_count
              }
            }
          }
        }
      `;

      vars = {
        first: 5,
        keyword: keywords.length > 0 ? keywords : '',
      }
    }*/

    this.props.client.query({
      query: query,
      variables: vars,
      forceFetch: true,
      activeCache: false,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      this.setState({
        searchingState: false,
      });

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        this.setState({
          bubbles: data.suggestBubbles ? data.suggestBubbles.edges : data.findBubbles.edges,
          stopSearch: true,
          open: true,
        });
      }
    }).catch((error) => {
      self.setState({
        searchingState: false,
      });
      notify.show(error.message, 'error', 2000);
    });
  }

  searchUsersBubbles = (keys, suggestion = false) => {
    let keywords = [];
    if (keys) {
      keywords = keys.map((item) => item.label);
    }
    else {
      keywords = this.state.keywords.map((item) => item.label);
    }

    const zip_code = this.state.zip_code;
    const radius = this.state.radius;

    this.setState({
      searchingState: true,
    });

    if (keywords.length === 0 && !zip_code && !radius) {
      this.setState({
        users: [],
        bubbles: [],
      });
      return;
    }
    this.searchUsers(keywords, zip_code, radius, suggestion);
    this.searchBubbles(keywords, zip_code, radius, suggestion);
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  addFriend = (friend_id, index) => {
    const self = this;

    this.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation newFriendRequest($friend_id: Int!) {
          requestFriendship(input: {friend_id: $friend_id }) {
            status
          }
        }
      `,
      variables: {
        friend_id: parseInt(friend_id, 10),
      },
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
        self.setState({
          loadingState: false,
        });
      }
      else if (data.requestFriendship.status === true) {
        notify.show('Friend request sent successfully!', 'success');
        const newUsers = self.state.users;
        newUsers[index].node.friendship_status = 'pending';
        self.setState({
          loadingState: false,
          users: newUsers,
        });
      }
      else {
        notify.show('Friend request failed!', 'error');
        self.setState({
          loadingState: false,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  removeFriend = (friend_id, index) => {
    const self = this;
    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation terminateFrienship($friend_id: Int!) {
          destroyFriendship(input: {friend_id: $friend_id }) {
            status
          }
        }
      `,
      variables: {
        friend_id: parseInt(friend_id, 10),
      },
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      self.setState({
        loadingState: false,
      });

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else if (data.destroyFriendship.status === true) {
        notify.show('Removed from friends successfully!', 'success');
        const newUsers = self.state.users;
        newUsers[index].node.friendship_status = null;
        self.setState({
          loadingState: false,
          users: newUsers,
        });
      }
      else {
        notify.show('Failed to remove from friends!', 'error');
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  handleTouchTap = (event) => {
    // This prevents ghost click.
    // event.preventDefault();

    this.setState({
      open: true,
      activeSearch: true,
      anchorEl: event.currentTarget,
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false,
      activeSearch: false,
    });
  };

  goToPage = (path) => {
    this.setState({
      open: false,
      activeSearch: false,
    });
    this.props.router.push(path);
  }

  toggleSearch = (value) => {
    this.setState({
      search_by: value,
      searchText: '',
    });
    setTimeout(() => this.searchUsersBubbles(), 500);
  }

  render() {

    const iconStyle = {
      width: 20,
      height: 20,
      verticalAlign: 'middle',
    };

    const subheaderStyles = {
      fontSize: 13,
      borderBottom: '1px solid #f1f1f1',
      lineHeight: '42px',
      marginTop: '-8px',
      display: 'flex',
      alignitems: 'center',
      justifyContent: 'space-between',
      textTransform: 'uppercase',
    };

    let resultSearchUsers = (<List>
      <Subheader style={subheaderStyles}>People</Subheader>
      <ListItem style={{ fontSize: 13 }} className='search-empty-item' primaryText={this.state.searchingState ? 'Searching...' : ''} />
    </List>);
    let resultSearchBubblz = (<List>
      <Subheader style={subheaderStyles}>Bubbles</Subheader>
      <ListItem style={{ fontSize: 13 }} className='search-empty-item' primaryText={this.state.searchingState ? 'Searching...' : ''} />
    </List>);

    if (this.state.users) {
      const { users } = this.state;
      if (!users.length) {
        resultSearchUsers = (<List>
          <Subheader style={subheaderStyles}>People</Subheader>
          <ListItem style={{ fontSize: 13 }} className='search-empty-item' primaryText='No people found' />
        </List>);
      }
      else {
        resultSearchUsers = (<List>
          <Subheader style={subheaderStyles}>People<Link className='search-more-link' to={`/search/people?q=${this.state.searchText}`}>More</Link></Subheader>
          {
            users.map((user, index) => (
              <SearchItem
                key={index}
                type='user'
                node={user.node}
                quickSearch
                goToPage={this.goToPage}
              />
            ))
          }
        </List>
       );
      }
    }

    if (this.state.bubbles) {
      const { bubbles } = this.state;
      if (!bubbles.length) {
        resultSearchBubblz = (<List>
          <Subheader style={subheaderStyles}>Bubbles</Subheader>
          <ListItem style={{ fontSize: 13 }} className='search-empty-item' primaryText='No bubbles found' />
        </List>);
      }
      else {
        resultSearchBubblz = (<List>
          <Subheader style={subheaderStyles}>Bubbles<Link className='search-more-link' to={`/search/bubbles?q=${this.state.searchText}`}>More</Link></Subheader>
          {bubbles.map((bubble, index) => (
            <SearchItem key={index} type='bubble' node={bubble.node} quickSearch goToPage={this.goToPage} />
          ))}
        </List>);
      }
    }

    return (
      <div className='search-wrapper'>
        <div className='search-wrapper-inner'>
          <FormsyForm
            onKeyPress={this.onKeyPress}
            onValid={this.enableButton}
            onInvalid={this.disableButton}
            onValidSubmit={this.searchUsers}
            onInvalidSubmit={this.onInvalidFormSubmit}
            noValidate
          >
            <IconActionSearch color={this.state.activeSearch ? '#193446' : '#ffffff'} style={{ ...iconStyle, width: 15, height: 15, position: 'absolute', top: 18, left: 8, zIndex: 999 }} />
            <AutoComplete
              className='myb-autocomplete search-field'
              ref='select_keywords'
              underlineShow={false}
              inputStyle={{
                border: 'none',
                borderBottom: 'none',
                borderRadius: '999em',
                padding: '0 0 0 28px',
                fontSize: '13px',
                height: '30px',
                marginTop: '0',
                color: this.state.activeSearch ? '#193446' : '#ffffff',
                backgroundColor: this.state.activeSearch ? '#ffffff' : '#193446',
                paddingLeft: this.state.isSmallScreen ? '50px' : '34px',
              }}
              style={{ height: 40 }}
              textFieldStyle={{ height: 40 }}
              floatingLabelStyle={{
                paddingLeft: '20px',
                fontSize: '13px',
                top: '5px',
                left: '14px',
                color: '#ffffff',
              }}
              dataSource={this.state.tempDataSource}
              onUpdateInput={this.handleUpdateCustomKeywords}
              onPaste={this.handleOnPaste}
              onTouchTap={this.handleTouchTap}
              onKeyPress={this.onKeyPressAutoField}
              floatingLabelText={
                !this.state.searchText && !this.state.activeSearch ?
                  'Search'
                :
                  ''
              }
              searchText={this.state.searchText}
              filter={this.filterKeywords}
              openOnFocus={false}
              maxSearchResults={10}
              fullWidth
              animated={false}
              errorText={
                (!this.state.ignorePristine || (this.state.keywords && this.state.keywords.length > 0)) ?
                ''
                :
                'You must enter at least one keyword'}
            />

            <Popover
              className={`search-wrapper-popover ${this.state.open ? 'open' : ''}`}
              open={this.state.open && this.state.searchText !== ''}
              canAutoPosition={false}
              anchorEl={this.state.anchorEl}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              targetOrigin={{ horizontal: 'left', vertical: 'top' }}
              onRequestClose={this.handleRequestClose}
              style={{
                width: this.state.isSmallScreen ? '100%' : '450px',
                padding: '12px 24px 12px 12px',
                marginTop: '12px',
              }}
            >
              {this.state.suggestSearch ?
                null
                :
                <div
                  className='keywords-wrapper'
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: '14px',
                    lineHeight: '34px',
                  }}
                >
                  Search for &nbsp;{this.state.keywords.map(this.renderKeyword, this)}
                </div>
              }
              {this.state.suggestSearch ?
                null
                :
                <SearchFilters
                  activeSearch={this.state.search_by}
                  search={this.searchUsersBubbles}
                  toggleSearch={this.toggleSearch}
                  rateSliderValue={0}
                  zip_code={this.state.zip_code}
                  radius={this.state.radius}
                  setZipCode={(zip_code) => this.setState({ zip_code })}
                  setRadius={(radius) => this.setState({ radius })}
                />
              }
              <div className='search-results-wrapper'>
                {resultSearchUsers}
                {resultSearchBubblz}
              </div>
            </Popover>
          </FormsyForm>
        </div>
      </div>
    );
  }
}

export default withRouter(withApollo(Search));
