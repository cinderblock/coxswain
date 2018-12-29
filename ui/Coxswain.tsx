import React, { useState, useEffect } from 'react';
import SocketConnection, { eventHandler, useStore } from './SocketConnection';
import Tunnel from './ConfigTunnel';
import Client from './ConfigClient';
import 'antd/dist/antd.css';
import { Layout, Menu, Icon } from 'antd';
import Logo from './Logo';

export default function Coxswain(props: any) {
  return (
    <Layout>
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={broken => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="logo" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['3']}>
          <Menu.Item key="1">
            <Icon type="user" />
            <span className="nav-text">Web UI</span>
          </Menu.Item>
          <Menu.Item key="2">
            <Icon type="cloud-download" />
            <span className="nav-text">Tunnel</span>
          </Menu.Item>
          <Menu.Item key="3">
            <Icon type="branches" />
            <span className="nav-text">Upstreams</span>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ background: '#fff', padding: 0 }} />
        <Layout.Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>content</div>
        </Layout.Content>
        <Layout.Footer style={{ textAlign: 'center' }}>
          <Logo style={{ width: '1em' }} />
          <a href="https://github.com/cinderblock/coxswain">coxswain</a> -{' '}
          <a href="https://github.com/cinderblock/coxswain">Docs</a>
        </Layout.Footer>
      </Layout>
    </Layout>
    // <Tunnel />
    // <Client />
  );
}
