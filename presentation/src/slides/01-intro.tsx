export default function Slide01Intro() {
  return (
    <div className="slide title-slide" style={{ background: 'linear-gradient(150deg, #04111f 0%, #07090f 60%, #091520 100%)' }}>
      <div className="slide-bg-image" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}title-bg.png)`, opacity: 0.1 }} />
      <div className="title-content">
        <h1>Sandbox OpenCode with Devcontainers</h1>
        <div className="speaker">
          <span className="speaker-name">Sachit Vithaldas</span>
        </div>
      </div>
      <aside className="notes">
        Hello, I'm Sachit Vithaldas, a Software Engineer. I'd like to talk to you
        today about how I sandbox OpenCode to develop with agents in a secure manner.
      </aside>
    </div>
  )
}
