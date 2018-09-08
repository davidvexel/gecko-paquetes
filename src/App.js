import React, { Component } from 'react';
import { List, Card, Layout, Menu, Breadcrumb, Icon, DatePicker, Select, Avatar, Button } from 'antd';
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
      listLoading: false,
      adultsQty: 2,
      kidsQty: 0,
      total: 0,
      subtotal: 0,
      discount: 0,
    }

    this.updateAdultsQty = this.updateAdultsQty.bind(this);
    this.updateKidsQty = this.updateKidsQty.bind(this);

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
    const that = this;

    // Set sidebar as loading
    this.setState({listLoading: true, loading: true});

    // Check if item is in cart already

    // Make sure the tour has a WC Product related
    if( item.meta.tour_booking_product && item.meta.tour_booking_product[0]) {
      // Get the product information
      // @TODO: Instead of fucking around with the child or adult attributes,
      // just asign the lower price to child, and highest to adults ¯\_(ツ)_/¯
      this.WooCommerce.get(`products/${item.meta.tour_booking_product[0]}/variations`, function(err, data, res) {
        let variations = JSON.parse(res);
        let prices = [];
        if(variations.length === 2) {
          // go through variations
          variations.forEach(element => {
            prices.push(element.regular_price);
          });

          // Get minimum and maximum prices and assign them to item
          item.kidPrice = Math.min( ...prices );
          item.adultPrice = Math.max( ...prices );

          if (! selectedTours.filter(e => e.id === item.id).length > 0 ) {
            selectedTours.push(item);
          } else {
            // Remove key if already exists
            const index = selectedTours.indexOf(item);
            selectedTours.splice(index, 1);
          }

          that.setState({selectedTours: selectedTours, listLoading: false, loading: false});

          that.calculateTotals();

        } else {
          // product does not have 2 variations
          // return error
        }
      });
    }
  }

  updateAdultsQty(value) {
    this.setState({adultsQty: value},() => {
      // update totals
      this.calculateTotals();
    });
  }

  updateKidsQty(value) {
    this.setState({kidsQty: value},() => {
      // update totals
      this.calculateTotals();
    });
  }

  /**
   * Go through the selected tours and multiply the number of
   * adults and kids for it's price
   */
  calculateTotals() {
    const { selectedTours, adultsQty, kidsQty } = this.state;

    if( selectedTours.length > 0 ) {

      let adultsTotal = 0;
      let kidsTotal = 0;
      let subtotalAmount = 0;
      let discountPercent = 0;

      /**
       * Calculate discount
       */
      if(selectedTours.length === 2) {
        discountPercent = 20;
        this.setState({discount: discountPercent});
      } else if( selectedTours.length >= 3) {
        discountPercent = 25;
        this.setState({discount: discountPercent});
      } else {
        discountPercent = 0;
        this.setState({discount: discountPercent});
      }

      selectedTours.forEach( e => {
        adultsTotal = e.adultPrice * adultsQty;
        kidsTotal = e.kidPrice * kidsQty;
        
        // count tours and apply any discount
        subtotalAmount += adultsTotal + kidsTotal;
      });

      let discountAmount = (subtotalAmount/100) * discountPercent;

      this.setState({subtotal: subtotalAmount, discount: discountAmount.toFixed(2), total: subtotalAmount - discountAmount});
      
    } else {
      this.setState({subtotal: 0, discount: 0, total: 0});
    }
    
  }

  render() {
    const { tours, loading, selectedTours, listLoading, subtotal, discount, total } = this.state;
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
            <Menu.Item key="1">Inicio</Menu.Item>
            <Menu.Item key="2">Tours</Menu.Item>
            <Menu.Item key="3">Destinos</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Tours</Breadcrumb.Item>
            <Breadcrumb.Item>Paquetes Experiencias Xcaret</Breadcrumb.Item>
          </Breadcrumb>
          <div className="notice">Selecciona dos tours de esta lista y recibe un increible 20% de descuento. Selecciona 3 o más y recibe un 25% de descuento.</div>
          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content className="toursList" style={{ padding: '0 24px', minHeight: 280 }}>
              <List
                grid={{ gutter: 16, sm: 1, md: 2, lg: 3 }}
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
                      className={selectedTours.filter(e => e.id === item.id).length > 0 ? 'selected' : 'nononoo' }
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
                loading={listLoading}
                locale={{
                  emptyText: 'Selecciona algunos tours para comenzar'
                }}
                renderItem={item => (
                  <List.Item>
                    <Card
                      style={{width: '100%', margin: '20px'}}
                      actions={[<span>Adulto: {item.adultPrice}</span>, <span>Menor: {item.kidPrice}</span>]}
                    >
                    <Meta
                      title={item.title.rendered}
                      description={<DatePicker placeholder="Selecciona la fecha" />}
                      avatar={<Avatar src={item._embedded["wp:featuredmedia"][0].media_details.sizes.medium_large.source_url} />}
                    /> 
                    </Card>
                  </List.Item>
                )}
              />
              {selectedTours.length > 0 &&
                <div>
                  <Select defaultValue="2" onChange={this.updateAdultsQty} style={{width: "100%", margin: "20px"}}>
                    <Option value="1">1 Adulto</Option>
                    <Option value="2">2 Adultos</Option>
                    <Option value="3">3 Adultos</Option>
                    <Option value="4">4 Adultos</Option>
                    <Option value="5">5 Adultos</Option>
                  </Select>
                  <Select defaultValue="0" onChange={this.updateKidsQty} style={{width: "100%", margin: "20px"}}>
                    <Option value="0">Menores</Option>
                    <Option value="1">1 Menor</Option>
                    <Option value="2">2 Menores</Option>
                    <Option value="3">3 Menores</Option>
                    <Option value="4">4 Menores</Option>
                    <Option value="5">5 Menores</Option>
                  </Select>

                  <h2>Subtotal: ${subtotal} USD</h2>
                  <h2 className="red">Descuento: ${discount} USD</h2>
                  <h2>Total: ${total} USD</h2>

                  <Button size="large" type="primary">Comprar</Button>
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
