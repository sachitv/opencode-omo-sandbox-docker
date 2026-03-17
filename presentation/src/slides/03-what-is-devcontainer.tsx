export default function Slide03WhatIsDevcontainer() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>📦 What is a Devcontainer?</h2>
      <p className="lede">A containerized development environment described as code.</p>
      <div className="grid two-up" style={{ marginTop: '1.1em' }}>
        <div className="card">
          <h3>📋 The spec</h3>
          <ul>
            <li>📄 <code>.devcontainer/devcontainer.json</code> file</li>
            <li>🐳 Base image</li>
            <li>🔧 Tools and extensions</li>
            <li>🔌 Port forwarding</li>
            <li>🔄 Lifecycle hooks</li>
          </ul>
        </div>
        <div className="card">
          <h3>💻 The experience</h3>
          <ul>
            <li>🔌 Your editor attaches to a running container instead of using your host toolchain</li>
            <li>📂 Code lives in a bind mount</li>
            <li>👥 Everyone gets the same baseline environment</li>
          </ul>
        </div>
      </div>
      <div className="callout" style={{ marginTop: '1em' }}>
        <strong>Why this matters:</strong> it runs on your machine or in the cloud, pins tools and runtimes in config, and can be rebuilt on any machine from the same repo state.
      </div>
    </div>
  )
}
