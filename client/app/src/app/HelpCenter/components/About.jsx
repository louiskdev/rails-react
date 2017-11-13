/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

const tabStyle = {
  display: 'block',
  width: '100%',
};

class About extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: 'a',
    };
  }

  handleChange = (value) => {
    this.setState({
      value: value,
    });
  };

  render() {

    return (
      <div className='help-page-content about'>
        <Tabs
          value={this.state.value}
          onChange={this.handleChange}
          className="help-tabs"
          contentContainerClassName="help-tabs-container"
          inkBarStyle={{ background: 'transparent' }}
        >
          <Tab label="How to search people or groups?" value="a" className="help-tab" style={tabStyle }>
            <div>
              <h2>How to search people or groups?</h2>
              <p>
                MyBubblz allows you to search for people or groups (Bubbles) based on interests and location. We also allow you to search for someone's username should it be known to you. This allows you to provide a safe private environment where strangers cannot simply search for your name and find out your private life.
              </p>
            </div>
          </Tab>
          <Tab label="What is a bubble and how do i create one?" value="b" className="help-tab" style={tabStyle }>
            <div>
              <h2>What is a bubble and how do i create one?</h2>
              <p>
                A bubble is a group that is based on interests. A bubble can be public (sports, tennis, golf, etc..) or private (friends, family, etc..) - this way, you control the content that your friends or coworkers see. For example, if you have a private bubble for your office, anything posted there will only be seen by your colleagues who are also part of that bubble. On the other hand, if you were to post in a private family bubble, none of the posts would be seen by those colleagues even though you are friends.
              </p>
              <p>
                We separate content by bubbles; nobody can see what you post unless they are also part of that bubble.
              </p>
              <p>
                Anything posted on your profile can be seen by all your friends.
              </p>
            </div>
          </Tab>
          <Tab label="What can i use my bubble for?" value="c" className="help-tab" style={tabStyle }>
            <div>
              <h2>What can i use my bubble for?</h2>
              <p>
                There are unlimited uses for our bubbles. Here are some examples:
              </p>
              <ul>
                <li> A professor creates a bubble for his/her class and allows students to chat (for extra help), share documents, and view grades.</li>
                <li> A family that has members in different countries can use a bubble to share images, videos, chat, and use our video feature.</li>
                <li> A group of colleagues create a bubble to exchange ideas on a project, deadlines, documents, and chat in realtime.</li>
              </ul>
            </div>
          </Tab>
          <Tab label="Can i invite my friends?" value="d" className="help-tab" style={tabStyle }>
            <div>
              <h2>Can i invite my friends?</h2>
              <p>
                You absolutely can ! We are currently working on integrating with the Facebook API platform to allow you to select from your friends list those that you would like to invite. However, you may invite friends via email already.
              </p>
            </div>
          </Tab>
          <Tab label="How do i add someone as a friend?" value="e" className="help-tab" style={tabStyle }>
            <div>
              <h2>How do i add someone as a friend?</h2>
              <p>
                If you know their username, you can search it on our search bar and go to their profile. You will then find a "Add to friends" button.
              </p>
            </div>
          </Tab>
          <Tab label="Are my posts and images searchable on the web?" value="f" className="help-tab" style={tabStyle }>
            <div>
              <h2>Are my posts and images searchable on the web?</h2>
              <p>
                NO. That is one of our main focus; to keep your private life... PRIVATE. Search engines cannot crawl into our platform therefore anything you post remains hidden.
              </p>
              <p>
                Keep in mind, if you post in a public bubble, those posts may be found on the web - if you have anything that you'd like to keep private, do not post it in public.
              </p>
            </div>
          </Tab>
          <Tab label="What are apps?" value="g" className="help-tab" style={tabStyle }>
            <div>
              <h2>What are apps?</h2>
              <p>
                Apps are add-ons to bubbles. This is one of our main advantages in that we allow you to customize your bubble for what ever purpose you wish. Every bubble comes with default apps : Blog, Gallery, Events & Chat however, you may add additional apps such as Dropbox, Instagram, Soundcloud, and many more. A full list will be made available soon.
              </p>
            </div>
          </Tab>
          <Tab label="Do you provide an API for apps?" value="h" className="help-tab" style={tabStyle }>
            <div>
              <h2>Do you provide an API for apps?</h2>
              <p>
                This is currently in the works. We are working towards opening our API to developers wishing to create their own apps.
              </p>
            </div>
          </Tab>
          <Tab label="Do you encrypt data?" value="i" className="help-tab" style={tabStyle }>
            <div>
              <h2>Do you encrypt data?</h2>
              <p>
                We use SSL encryption to protect your data on the surface. Our servers are also secured and protected and your information on our database is encrypted.
              </p>
            </div>
          </Tab>
          <Tab label="Can i register a business account?" value="j" className="help-tab" style={tabStyle }>
            <div>
              <h2>Can i register a business account?</h2>
              <p>
                This feature is on our roadmap. Once we have everything ironed out we will allow businesses to register and create business bubbles.
              </p>
            </div>
          </Tab>
          <Tab label="Do you have advertisements?" value="k" className="help-tab" style={tabStyle }>
            <div>
              <h2>Do you have advertisements?</h2>
              <p>
                We do not have any advertisements on our site at this time. Enjoy our platform without any distractions!
              </p>
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  }

}

export default About;
