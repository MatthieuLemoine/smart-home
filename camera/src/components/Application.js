import React from 'react';
import styled from 'styled-components';
import WSAvcPlayer from 'h264-live-player';

const Container = styled.div`
  display         : flex;
  flex-direction  : column;
  justify-content : flex-start;
  align-items     : center;
  width           : 100%;
  height          : 100%;
`;

const Video = styled.canvas``;

const Controls = styled.div`
  display         : flex;
  flex-direction  : row;
  justify-content : center;
  align-items     : center;
`;

const Control = styled.button``;

class Application extends React.Component  {
  constructor() {
    super();
    this.setupPlayer = this.setupPlayer.bind(this);
    this.play        = this.play.bind(this);
    this.stop        = this.stop.bind(this);
  }
  setupPlayer(canvas) {
    const uri = `ws://${document.location.host}`;
    const wsavc = new WSAvcPlayer(canvas, 'webgl', 1, 35);
    wsavc.connect(uri);
    this.wsavc = wsavc;
  }
  play() {
    if (this.wsavc) {
      this.wsavc.playStream();
    }
  }
  stop() {
    if (this.wsavc) {
      this.wsavc.stopStream();
    }
  }
  render() {
    return (
      <Container>
        <Video innerRef={ref => this.setupPlayer(ref)} />
        <Controls>
          <Control onClick={this.play} >Start</Control>
          <Control onClick={this.stop} >Stop</Control>
        </Controls>
      </Container>
    );
  }
}

export default Application;
