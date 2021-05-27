import { auth0 } from '../../../lib/auth/auth0';

export default auth0.handleAuth({
  async profile(request, response) {
    await auth0.getAccessToken(request, response, { refresh: true });
    return auth0.handleProfile(request, response);
  },
});
