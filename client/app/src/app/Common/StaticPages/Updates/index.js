/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';

class Updates extends Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {

    return (
    <div className='news-and-updates'>
      <div className='welcome-wrapper'>
        <h1>News and Updates</h1>
      </div>
      <div className='inner-wrapper'>
        <div>
          <h2>News & Updates</h2>

          <p>We have read your feedback (Thank you! Keep them coming) and made changes to our platform that will improve your experience on the MyBubblz platform. It has been a little while since our last major update but rest assured, our team has been working continuously on those improvements and testing everything on our development server to make sure you are impressed next time you give us a try.</p>

          <h2>Dashboard</h2>

          <p>This is perhaps the most noticeable change visually - we improved the header, changed our navigation bars and expanded the chatbar to include more information. Not only is it cleaner and more user friendly, it has a better navigational flow that helps you get where you want while reducing clicks.</p>

          <p>Another big change on the dashboard is the content area. We have upgraded the styles and design to fill the space with important data - this also allows us to reduce the amount of clicks to see important information.</p>

          <p>You will notice we have added "Bubbles near you" and "People near you" - these pages allow you to find people & public bubbles around you that match the same interests as you. Yes, we know that not everyone wants to be found and for this reason, we will be adding a "Hide me" feature where you will not be found anywhere (not even the search!).</p>

          <p>Wait, that's not all ! styling has been upgraded on all other pages such as Messages, Events, and Gallery. Feel free to take a look and let us know what you think !</p>

          <h2>Bubbles</h2>

          <p>The layout for bubbles has been upgraded considerably as well. You may upload a cover image to further define your bubble and personalize it. Every bubble now comes with a "standard" set of apps (formerly known as widgets) : Blog, Gallery, Chat, Events and more apps can be added during the bubble creation process. You can add or remove any app at any time through the bubble management page.</p>

          <p>We are also working towards providing apps that have public API's such as Instagram, Dropbox, etc.. so each bubble is unique and fits your needs.</p>

          <p>We made improvements to the blogging app to optimize user experience. You can now post blog content directly from the bubble homepage (feed). The blog feature will have a WYSIWYG editor that will allow you to format your blog and include images as you would on a regular blog elsewhere.</p>

          <p>When creating an album and uploading multiple images, each image before showed on its own post which would easily clutter your feed as well as your friends' feeds (imagine uploading 50 images). We changed it so that it now shows on one post only, similar to other social medias.</p>

          <h2>Mobile and Cross-Browsers</h2>

          <p>One major issue was the fact that MyBubblz performed better in certain browsers and mostly unstable in others. Our new upgrades took into consideration not only other browsers, but tablets and mobile so now you may use Mybubblz from your favorite browser or device.</p>

          <h2>Help</h2>

          <p>We understand that being different sometimes means a learning curve for users. With that in mind, we have created a help center with common questions and answers. This section will be elaborated further as we go on and receive feedback from our users.</p>

          <p>Once again we are still in beta and if you do find any issues, please use the feedback button to report them. We do read and catalog every single feedback report.</p>
        </div>
        <h3>v1.0.0-beta2 <span className='time'>(2016-11-28)</span></h3>
        <ul>
          <li>Fixed chat windows changing position randomly while chatting</li>
          <li>Fixed leaving a private bubble redirects to "bubble not found" page</li>
          <li>Messages and notification not appearing realtime after being idle</li>
          <li>Messages page styling update</li>
          <li>Shortened bubble names - adds <tt>"..."</tt> to the rest of the name to stay in one line</li>
          <li>Fixed multiple issues in the search results</li>
          <li>Do not allow empty keywords in complete profile page</li>
          <li>Dashboard counter not refreshing in realtime</li>
          <li>Disabled <tt>@mentions</tt> in the chatbar (1v1 chat)</li>
          <li>Fixed filters in feeds not ordering correctly</li>
          <li>Chat widget style fixes</li>
          <li>Image preview fix</li>
          <li>News and updates page created</li>
        </ul>
      </div>
    </div>
    );
  }

}

export default Updates;
