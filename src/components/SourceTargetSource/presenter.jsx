import React from 'react';
import { Link } from 'react-router';

function Welcome({ user }) {
    return (
      <div>
        Here goes welcome screen. { user ? `Hello, ${user.name}` : '' }<br/>
        <Link to="/evidence-graph">Go to graph</Link>
      </div>
    )
};

export default Welcome;