/* @flow */
/* eslint-disable max-len */

import RootApp from './RootApp';
import injectTapEventPlugin from 'react-tap-event-plugin';
import DefaultLayout from '@layouts/DefaultLayout';
import InnerPageLayout from '@layouts/InnerPageLayout';
import HomeScene from './app/Home/scenes/HomeScene';
import SignInScene from './app/SignIn/scenes/SignInScene';
import CompleteProfileScene from './app/CompleteProfile/scenes/CompleteProfileScene';
import CreatePasswordScene from './app/CreatePassword/scenes/CreatePasswordScene';
import ForgotPasswordScene from './app/ForgotPassword/scenes/ForgotPasswordScene';
import ResetPasswordScene from './app/ResetPassword/scenes/ResetPasswordScene';
import HowItWorks from './app/Common/HowItWorks/scenes/HowItWorksScene';
import DashboardScene from './app/Dashboard/scenes/DashboardScene';
import UserProfileScene from './app/UserProfile/scenes/UserProfileScene';
import BubblzScene from './app/Bubblz/scenes/BubblzScene';
import HelpScene from './app/HelpCenter/scenes/HelpScene';

import AdminPageLayout from '@layouts/AdminPageLayout';
import Statistics from './app/Admin/Statistics';
import MassEmailing from './app/Admin/MassEmailing';

/* Static pages */
import TOS from './app/Common/StaticPages/TOS';

injectTapEventPlugin();

function isLoggedIn() {
  const currentUser = !!localStorage.getItem('mbubblz_user');
  const authToken = !!localStorage.getItem('mbubblz_token');
  const clientId = !!localStorage.getItem('mbubblz_client_id');

  return currentUser && authToken && clientId;
}

function requireAuth(nextState, replace) {

  if (nextState.location.query.confirmation_token) {
    replace({
      pathname: '/complete_registration',
      query: {
        confirmation_token: nextState.location.query.confirmation_token,
        new_member_token: nextState.location.query.new_member_token,
      },
      state: { nextPathname: '/complete_registration' },
    });
    return;
  }

  if (!isLoggedIn) {
    replace({
      pathname: '/signin',
      state: { nextPathname: nextState.location.pathname },
    });
  }
}

export default {
  component: RootApp,
  childRoutes: [
    {
      path: '/mybubblz-admin',
      getComponent(location, cb) {
        return isLoggedIn() ? cb(null, AdminPageLayout) : cb(null, DefaultLayout);
      },
      indexRoute: {
        getComponent: (location, cb) => {
          return isLoggedIn() ? cb(null, Statistics) : cb(null, HomeScene);
        },
      },
      onEnter: requireAuth,
      childRoutes: [
        { path: 'mass-emailing', component: MassEmailing },
      ],
    },
    {
      path: '/',
      getComponent(location, cb) {
        return isLoggedIn() ? cb(null, InnerPageLayout) : cb(null, DefaultLayout);
      },
      indexRoute: {
        getComponent: (location, cb) => {
          return isLoggedIn() ? cb(null, DashboardScene) : cb(null, HomeScene);
        },
      },
      childRoutes: [
        // Your not authenticated views under SiteLayout
        { path: '/signin', component: SignInScene },
        { path: '/complete_registration', component: CompleteProfileScene },
        { path: '/create_password', component: CreatePasswordScene },
        { path: '/forgot_password', component: ForgotPasswordScene },
        { path: '/reset_password', component: ResetPasswordScene },
        { path: '/how_it_works', component: HowItWorks },
        { path: '/tos', component: TOS },

        { onEnter: requireAuth,
          childRoutes: [
            { path: '/page/:activity_id', component: DashboardScene },
          ],
        },

        { onEnter: requireAuth,
          childRoutes: [
            { path: 'u/:username', component: UserProfileScene,
              childRoutes: [
                { path: ':dash_tab', component: UserProfileScene,
                  childRoutes: [
                    { path: 'album/:album_id', component: UserProfileScene },
                  ],
                },
              ],
            },
          ],
        },

        { onEnter: requireAuth,
          childRoutes: [
            { path: 'bubbles/:permalink', component: BubblzScene,
              childRoutes: [
                { path: ':bubble_tab', component: BubblzScene,
                  childRoutes: [
                    { path: 'album/:album_id', component: BubblzScene },
                    { path: 'all-media', component: BubblzScene },
                  ],
                },
              ],
            },
          ],
        },

        { onEnter: requireAuth,
          childRoutes: [
            { path: '/help', component: HelpScene },
            { path: '/help/:help_page', component: HelpScene },
          ],
        },

        {
          // if not logged in, redirect to login page, once the user logs in, they'll be redirected to the childroute
          onEnter: requireAuth,
          childRoutes: [
            // Your authenticated views under Dashboard
            { path: ':dash_tab', component: DashboardScene,
              childRoutes: [
                { path: 'album/:album_id', component: DashboardScene },
                { path: 'all-media', component: DashboardScene },
                { path: ':subparam', component: DashboardScene },
              ],
            },
          ],
        },

      ],
    },
  ],
};

/*
export default (
  <Route path='/'>

    <Route component={DefaultLayout}>
      <IndexRoute component={HomeScene} />
      <Route path='signin' component={SignInScene} />
      <Route path='complete_registration' component={CompleteProfileScene} />
      <Route path='create_password' component={CreatePasswordScene} />
      <Route path='forgot_password' component={ForgotPasswordScene} />
      <Route path='reset_password' component={ResetPasswordScene} />
      <Route path='how_it_works' component={HowItWorks} />
      <Route path='tos' component={TOS} />
    </Route>

    <Route component={InnerPageLayout} onEnter={requireAuth}>

      <Route path='dashboard' component={DashboardScene} >
        <Route path=':dash_tab' component={DashboardScene}>
          <Route path='album/:album_id' component={DashboardScene} />
          <Route path='all-media' component={DashboardScene} />
          <Route path=':subparam' component={DashboardScene} />
        </Route>
      </Route>

      <Route path='/page/:activity_id' component={DashboardScene} />

      <Route path='u/:username' component={UserProfileScene} >
        <Route path=':dash_tab' component={UserProfileScene}>
          <Route path='album/:album_id' component={UserProfileScene} />
        </Route>
      </Route>

      <Route path='bubbles/:permalink' component={BubblzScene}>
        <Route path=':bubble_tab' component={BubblzScene} >
          <Route path='album/:album_id' component={BubblzScene} />
          <Route path='all-media' component={BubblzScene} />
        </Route>
      </Route>

    </Route>

    <Route path='mybubblz-admin' component={AdminPageLayout} onEnter={requireAuth}>
      <IndexRoute component={AdminDashboard} />
    </Route>

  </Route>
);
*/
