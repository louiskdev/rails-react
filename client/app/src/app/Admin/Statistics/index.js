import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import IconContentRemoveCircle from 'material-ui/svg-icons/content/remove-circle';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';

import CommonStyles from '@admin/CommonStyles';
import { formatTo2Digits } from '@utils/formatter';
import hoc from './hoc';

class Statistics extends Component {

  state = {
    adminUsers: false,
    userJoinPeriodType: 1,
    userJoinPeriodCount: 0,
    userJoinPeriodStartDate: null,
    userJoinPeriodEndDate: null,
  }

  formatFloat(v) {
    return Math.round(v * 100) / 100;
  }

  formatSeconds(sec) {
    const h = parseInt(sec / 3600);
    const m = parseInt((sec % 3600) / 60);
    const s = sec % 60;
    return `${formatTo2Digits(h)}:${formatTo2Digits(m)}:${formatTo2Digits(s)}`;
  }

  loadData = () => {
    // date period for joined user count
    const periodType = this.state.userJoinPeriodType;
    let startDate = new Date();
    let endDate = new Date();
    if (periodType === 1) {
      startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
    }
    else if (periodType === 2) {
      startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
      startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    }
    else if (periodType === 3) {
      startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
      startDate.setDate(startDate.getDate() - startDate.getDay() - 6);
      endDate.setTime(startDate.getTime());
      endDate.setHours(23); endDate.setMinutes(59); endDate.setSeconds(59);
      endDate.setDate(endDate.getDate() + 6);
    }
    else if (periodType === 4) {
      startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
      startDate.setDate(1);
    }
    else if (periodType === 5) {
      startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - 1);
      endDate.setTime(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1); endDate.setDate(0);
      endDate.setHours(23); endDate.setMinutes(59); endDate.setSeconds(59);
    }
    else if (periodType === 0) {
      startDate = this.state.userJoinPeriodStartDate;
      endDate = this.state.userJoinPeriodEndDate;
    }
    this.props.client.query({
      query: gql`
        query adminUsers($startDate: String, $endDate: String) {
          adminUsers {
            success
            totalUsers
            averageSessionTime
          }
          adminUsersJoinedCount(start_date: $startDate, end_date: $endDate) {
            totalUsers
          }
          adminBubbles {
            bubbleCreateCount
            bubbleJoinCount
            totalPrivateBubbles
            totalPublicBubbles
          }
          adminCommonKeywords(first: 10) {
            edges {
              node {
                id
                name
              }
            }
          }
          admins {
            edges {
              node {
                id
                username
              }
            }
          }
          adminActiveUsers(start_date: $startDate, end_date: $endDate) {
            success
            activeUsers
          }
          adminZipCodesUsed {
            success
            zip_codes {
              edges {
                node
              }
            }
          }
        }
      `,
      variables: {
        startDate: startDate ? startDate.toISOString() : '',
        endDate: endDate ? endDate.toISOString() : '',
      },
      activeCache: false,
      forceFetch: true,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 5000);
        }
        else if (errors.message) {
          notify.show(errors.message, 'error', 5000);
        }
      }
      else {
        this.setState({
          adminUsers: data.adminUsers,
          userJoinPeriodCount: data.adminUsersJoinedCount ? data.adminUsersJoinedCount.totalUsers : 0,
          adminBubbles: data.adminBubbles,
          commonKeywords: data.adminCommonKeywords.edges ? data.adminCommonKeywords.edges : [],
          admins: data.admins.edges ? data.admins.edges : [],
          adminActiveUsers: data.adminActiveUsers,
          zipCodes: data.adminZipCodesUsed.success ? data.adminZipCodesUsed.zip_codes.edges : [],
        });
      }
    }).catch((error) => {
      console.log(error);
      notify.show(error.message ? error.message : 'Unexpected error', 'error', 5000);
    });
  }

  handlePeriodChange = (event, index, value) => {
    this.setState({
      userJoinPeriodType: value,
    }, () => {
      this.loadData();
    });
  }

  handlePeriodStartDateChange = (event, date) => {
    this.setState({
      userJoinPeriodStartDate: date,
    }, () => {
      this.loadData();
    });
  }

  handlePeriodEndDateChange = (event, date) => {
    this.setState({
      userJoinPeriodEndDate: date,
    }, () => {
      this.loadData();
    });
  }

  handleAddAdmin = () => {
    const username = this.refs.newAdminUsername.input.value;
    if (!username) {
      return;
    }
    this.props.changePermission({ variables: { username: username, admin: 1 } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 5000);
        }
        else if (errors.message) {
          notify.show(errors.message, 'error', 5000);
        }
      }
      else if (data.changePermission.status) {
        const admins = this.state.admins;
        const newAdmins = [];
        admins.every(admin => {
          newAdmins.push(admin);
        });
        newAdmins.push({
          node: {
            username,
          },
        });
        this.setState({
          admins: newAdmins,
        });
      }
      else {
        notify.show('Unexpected error', 'error', 5000);
      }
    }).catch((error) => {
      console.log(error);
      notify.show(error.message ? error.message : 'Unexpected error', 'error', 5000);
    });
  }

  handleRemoveAdmin = (username) => {
    if (!confirm(`Are you sure to revoke admin permission from ${username}?`)) {
      return;
    }
    this.props.changePermission({ variables: { username: username, admin: 0 } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 5000);
        }
        else if (errors.message) {
          notify.show(errors.message, 'error', 5000);
        }
      }
      else if (data.changePermission.status) {
        const admins = this.state.admins;
        const newAdmins = [];
        admins.every((admin, i) => {
          if (admin.node.username !== username) {
            newAdmins.push(admin);
          }
        });
        this.setState({
          admins: newAdmins,
        });
      }
      else {
        notify.show('Unexpected error', 'error', 5000);
      }
    }).catch((error) => {
      console.log(error);
      notify.show(error.message ? error.message : 'Unexpected error', 'error', 5000);
    });
  }

  componentDidMount() {
    this.loadData();
  }

  render() {
    const {
      adminUsers,
      adminBubbles,
      userJoinPeriodType, userJoinPeriodCount,
      userJoinPeriodStartDate, userJoinPeriodEndDate,
      commonKeywords,
      admins,
      adminActiveUsers,
      zipCodes,
    } = this.state;

    if (!adminUsers) {
      return <div>Loading...</div>;
    }

    if (!adminUsers.success) {
      return <div>Error occurred.</div>;
    }

    const { totalUsers, averageSessionTime } = adminUsers;
    const { bubbleCreateCount, bubbleJoinCount, totalPrivateBubbles, totalPublicBubbles } = adminBubbles;

    return (
      <div>
        <h2 style={CommonStyles.pageTitleStyle}>Users</h2>
        <table>
          <tbody>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Total users:</td>
              <td>{totalUsers}</td>
            </tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Average session time:</td>
              <td>{this.formatSeconds(averageSessionTime)}</td>
            </tr>
            <tr>
              <td>
                Period: <DropDownMenu
                  value={userJoinPeriodType}
                  onChange={this.handlePeriodChange}
                  style={{ width: 200, ...CommonStyles.dropdownStyle }}
                  autoWidth={false} >
                  <MenuItem value={1} primaryText='today' />
                  <MenuItem value={2} primaryText='this week' />
                  <MenuItem value={3} primaryText='last week' />
                  <MenuItem value={4} primaryText='this month' />
                  <MenuItem value={5} primaryText='last month' />
                  <MenuItem value={0} primaryText='in selected period' />
                </DropDownMenu>
                {
                  userJoinPeriodType === 0 && <div>
                    <DatePicker
                      style={CommonStyles.datepickerStyle}
                      textFieldStyle={CommonStyles.datepickerTextFieldStyle}
                      floatingLabelText='Start date'
                      value={userJoinPeriodStartDate}
                      onChange={this.handlePeriodStartDateChange} />
                    <DatePicker
                      style={CommonStyles.datepickerStyle}
                      textFieldStyle={CommonStyles.datepickerTextFieldStyle}
                      floatingLabelText='End date'
                      value={userJoinPeriodEndDate}
                      onChange={this.handlePeriodEndDateChange} />
                  </div>
                }
              </td>
            </tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>
                Number of joined users:
              </td>
              <td>{userJoinPeriodCount}</td>
            </tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>
                Number of active users:
              </td>
              <td>{adminActiveUsers.activeUsers}</td>
            </tr>
          </tbody>
        </table>
        <h2 style={CommonStyles.pageTitleStyle}>Bubbles</h2>
        <table>
          <tbody>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Average number of created bubbles per user:</td>
              <td>{totalUsers ? this.formatFloat(bubbleCreateCount / totalUsers) : 0}</td>
            </tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Average number of joined bubbles per user:</td>
              <td>{totalUsers ? this.formatFloat(bubbleJoinCount / totalUsers) : 0}</td>
            </tr>
            <tr><td>
              <div style={{ width: '100%', height: 5 }} />
            </td></tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Total public bubbles:</td>
              <td>{totalPublicBubbles}</td>
            </tr>
            <tr>
              <td style={CommonStyles.dataTableLabel}>Total private bubbles:</td>
              <td>{totalPrivateBubbles}</td>
            </tr>
          </tbody>
        </table>
        <h2 style={CommonStyles.pageTitleStyle}>Common Keywords</h2>
        {commonKeywords.map((keyword, i) => (
          <span key={keyword.node.id}>{keyword.node.name}{i < commonKeywords.length - 1 && ', '}</span>
        ))}
        <h2 style={CommonStyles.pageTitleStyle}>Zip codes</h2>
        {zipCodes.map((zipcode, i) => (
          <span key={zipcode.node}>{zipcode.node}{i < zipCodes.length - 1 && ', '}</span>
        ))}
        <h2 style={CommonStyles.pageTitleStyle}>Admins</h2>
        {admins.map((admin, i) => (
          <div key={admin.node.id}>
            <span style={CommonStyles.usernameStyle}>
              {admin.node.username}
            </span>
            <a href='javascript:;' onClick={this.handleRemoveAdmin.bind(this, admin.node.username)}>
              <IconContentRemoveCircle
                color='#f00'
                style={CommonStyles.removeIconStyle} />
            </a>
          </div>
        ))}
        <h3 style={CommonStyles.subtitleStyle}>Add a new admin</h3>
        <TextField hintText='Username' ref='newAdminUsername' style={{ marginRight: 10 }} />
        <FlatButton label='Add' primary onClick={this.handleAddAdmin} />
      </div>
    );
  }

}

export default withApollo(hoc(Statistics));
