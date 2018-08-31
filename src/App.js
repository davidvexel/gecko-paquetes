import React, { Component } from 'react';
import { List, Card, Layout, Menu, Breadcrumb, Icon, DatePicker, Select } from 'antd';
import './App.css';

const { Meta } = Card;
const { Header, Content, Footer, Sider } = Layout;
const Option = Select.Option;

class App extends Component {
  constructor() {
    super();
    this.state = {
      tours: [],
      loading: true,
      selectedTours: [],
    }
  }
  componentDidMount() {
    var WooCommerceAPI = require('woocommerce-api');

     // Woocommerce API
     this.WooCommerce = new WooCommerceAPI({
      url: 'https://www.geckoexcursions.com/',
      consumerKey: 'ck_f361cf55dc849ec4b68c86631d58868aa160d19c',
      consumerSecret: 'cs_3f700604ac4cd70af4d95ad460248a78b91978d4',
      wpAPI: true,
      version: 'wc/v2',
      queryStringAuth: true
    });

    fetch('https://www.geckoexcursions.com/wp-json/wp/v2/tour?_embed&filter[cat]=1')
      .then(response => response.json())
      .then(tours => this.setState({ tours, loading: false }));
  }
  selectTour(item) {
    const { selectedTours } = this.state;

    // Make sure the tour has a WC Product related
    if( item.meta.tour_booking_product && item.meta.tour_booking_product[0]) {
      // Get the product information
      // @TODO: Instead of fucking around with the child or adult attributes,
      // just asign the lower price to child, and highest to adults ¯\_(ツ)_/¯
      this.WooCommerce.get(`products/${item.meta.tour_booking_product[0]}/variations`, function(err, data, res) {
        console.log(JSON.parse(res));
      });
    }

    this.setState({selectedTours: selectedTours.concat(item)});
  }
  render() {
    const { tours, loading, selectedTours } = this.state;
    return (
      <Layout className="layout">
        <Header className="header">
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['2']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="0">
              <img height={50} src="https://www.geckoexcursions.com/wp-content/uploads/2017/07/logo-white-500.png" />
            </Menu.Item>
            <Menu.Item key="1">Home</Menu.Item>
            <Menu.Item key="2">Tours</Menu.Item>
            <Menu.Item key="3">Destinos</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb>
          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content className="toursList" style={{ padding: '0 24px', minHeight: 280 }}>
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={tours}
                loading={loading}
                renderItem={item => (
                  <List.Item>
                    <Card
                      style={{ width: 300 }}
                      cover={<img alt="example" src={item._embedded["wp:featuredmedia"][0].media_details.sizes.medium_large.source_url} />}
                      actions={[item.meta.tour_price, <Icon type="ellipsis" />]}
                      key={item.id}
                      onClick={() => this.selectTour(item)}
                    >
                      <Meta
                        title={item.title.rendered}
                        description={unescape(item.excerpt.rendered)}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Content>
            <Sider width={300} style={{ background: '#fff' }}>
              <List
                dataSource={selectedTours}
                locale={{
                  emptyText: 'No hay tours seleccionados'
                }}
                renderItem={item => (
                  <List.Item>
                    <Card>
                    <Meta
                      title={item.title.rendered}
                      description={<DatePicker />}
                    /> 
                    </Card>
                  </List.Item>
                )}
              />
              {selectedTours.length > 0 &&
                <div>
                  <Select defaultValue="Adultos" style={{width: "100%", margin: "0 20px"}}>
                    <Option value="1">1 Adulto</Option>
                    <Option value="2">2 Adultos</Option>
                    <Option value="3">3 Adultos</Option>
                    <Option value="4">4 Adultos</Option>
                    <Option value="5">5 Adultos</Option>
                  </Select>
                  <Select defaultValue="Menores" style={{width: "100%", margin: "0 20px"}}>
                    <Option value="1">1 Menor</Option>
                    <Option value="2">2 Menores</Option>
                    <Option value="3">3 Menores</Option>
                    <Option value="4">4 Menores</Option>
                    <Option value="5">5 Menores</Option>
                  </Select>
                </div>
              }
            </Sider>
          </Layout>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Gecko Cancun Tours © Developed by Vexel.mx
        </Footer>
      </Layout>
    );
  }
}

export default App;
