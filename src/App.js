import React, { Component } from 'react';
import { List, Card, Layout, Menu, Breadcrumb, Icon, DatePicker, Select, Avatar, Button, Row, Col, message } from 'antd';
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
      discountPercent: 0
    }

    this.updateAdultsQty = this.updateAdultsQty.bind(this);
    this.updateKidsQty = this.updateKidsQty.bind(this);
    this.updateTourDate = this.updateTourDate.bind(this);
    this.submitOrder = this.submitOrder.bind(this);
  }

  componentDidMount() {
    var WooCommerceAPI = require('woocommerce-api');

     // Woocommerce API
     this.WooCommerce = '';

    fetch('http://gecko.travelhub.test/api/tours')
      .then(response => response.json())
      .then(tours => this.setState({ tours: tours.success, loading: false }));
  }

  selectTour(item) {
    const { selectedTours } = this.state;
    const that = this;

    // Set sidebar as loading
    this.setState({listLoading: true, loading: true});

    // Check if item is in cart already

    // Make sure the tour has a WC Product related
    if( item.meta.tour_booking_product && item.meta.tour_booking_product[0] ) {
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

          // we need to push the variation id as well

          /**
           * Determine if add or remove the product
           */
          if (! selectedTours.filter(e => e.id === item.id).length > 0 ) {
            selectedTours.push(item);
          } else {
            // Remove key if already exists
            const index = selectedTours.indexOf(item);
            selectedTours.splice(index, 1);
          }

          // Update state
          that.setState({selectedTours: selectedTours, listLoading: false, loading: false});

          that.calculateTotals();

        } else {
          console.log(variations, res);
          alert('Hubo un error al agregar este producto, por favor intenta más tarde.');
          return;
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

      this.setState({subtotal: subtotalAmount, discount: discountAmount.toFixed(2), total: subtotalAmount - discountAmount, discountPercent: discountPercent});
      
    } else {
      this.setState({subtotal: 0, discount: 0, total: 0});
    }
    
  }

  /**
   * Validate if photo exists
   * 
   * @param {item} item 
   */
  renderPhoto(item) {
    if ( item.image ) {
      return 'http://gecko.travelhub.test/storage/' + item.image
    } else {
      return 'https://www.geckoexcursions.com/wp-content/uploads/2017/10/gecko-700x466.jpg';
    }
  }

  /**
   * Update tour date in object
   * 
   */
  updateTourDate(date, dateString, item) {
    const { selectedTours } = this.state;

    let index = selectedTours.indexOf(item);

    if(index > -1) {
      selectedTours[index].tourDate = dateString;
      this.setState({selectedTours});
    }
  }

  /**
   * Submit order
   *
   */
  submitOrder() {
    const { selectedTours, adultsQty, kidsQty, discountPercent } = this.state;
    console.log(selectedTours, adultsQty, kidsQty, discountPercent);
    
    this.setState({submitLoading: true});
    
    // Validate data
    if( selectedTours.length > 0 && adultsQty > 0 ) {

      // Generate WooCommerce Coupon
      if(discountPercent > 0) {

        let data = {
          code: 'paqExperiencias-' + Math.floor(Math.random() * 11),
          discount_type: 'percent',
          amount: discountPercent.toString(),
          individual_use: true,
        };

        // Do the WC Call
        this.WooCommerce.post('coupons', data, function(err, data, res) {
          let response = JSON.parse(res);

          if(response.id) {
            message.success('Tu cupón se ha generado exitosamente, redirigiendote a tu orden.', 10);

            const baseURL = 'http://geckoexcursions.com/es/cart';

            window.location.href = baseURL + `?currency=mxn&coupon=${response.id}&products=123&dates=123&variations=123&adults=2&kids=0`;
          }


        });

        this.setState({submitLoading: true});
      } else {
        // GO straight to the site sending the URL params
      }
    } else {
      this.setState({submitLoading: true});
      return alert('Hubo un error al crear orden, por favor intenta más tarde.');
    }
    // Use selectedTours and discount

    

    // Send to URL with ?products, variations, dates and coupon
  }

  render() {
    const { tours, loading, selectedTours, listLoading, subtotal, discount, total, discountPercent, submitLoading } = this.state;
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
            <Row>
              <Col lg={18} sm={24}>
                <Content className="toursList" style={{ padding: '0 24px', minHeight: 280 }}>
                  <List
                    grid={{ gutter: 16, sm: 1, lg: 2, xl: 3 }}
                    dataSource={tours}
                    loading={loading}
                    renderItem={item => (
                      <List.Item>
                        <Card
                          style={{ width: 300 }}
                          cover={<img alt="example" src={this.renderPhoto(item)} />}
                          actions={[<Icon type="plus" / >]}
                          key={item.id}
                          onClick={() => this.selectTour(item)}
                          className={selectedTours.filter(e => e.id === item.id).length > 0 ? 'selected' : '' }
                        >
                          <div className="addedIcon"><Icon type="check-circle" theme="outlined" /></div>
                          <div className="tourPrice">
                            <span>${ item.variations[0] && item.variations[0].price } USD</span>
                          </div>
                          <Meta
                            title={item.name}
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </Content>
              </Col>
              <Col lg={6} sm={24}>
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
                          style={{width: '100%'}}
                          actions={[<span>Adulto: {item.adultPrice}</span>, <span>Menor: {item.kidPrice}</span>]}
                        >
                        <Meta
                          title={item.title.rendered}
                          description={<DatePicker placeholder="Selecciona la fecha" showToday={false} onChange={(date, dateString) => this.updateTourDate(date, dateString, item)} />}
                          avatar={<Avatar src={this.renderPhoto(item)} />}
                        /> 
                        </Card>
                      </List.Item>
                    )}
                  />
                  {selectedTours.length > 0 &&
                    <div>
                      <Select defaultValue="2" onChange={this.updateAdultsQty} style={{width: "100%", margin: "20px 0"}}>
                        <Option value="1">1 Adulto</Option>
                        <Option value="2">2 Adultos</Option>
                        <Option value="3">3 Adultos</Option>
                        <Option value="4">4 Adultos</Option>
                        <Option value="5">5 Adultos</Option>
                      </Select>
                      <Select defaultValue="0" onChange={this.updateKidsQty} style={{width: "100%", margin: "20px 0"}}>
                        <Option value="0">Menores</Option>
                        <Option value="1">1 Menor</Option>
                        <Option value="2">2 Menores</Option>
                        <Option value="3">3 Menores</Option>
                        <Option value="4">4 Menores</Option>
                        <Option value="5">5 Menores</Option>
                      </Select>

                      <h2>Subtotal: ${subtotal} USD</h2>
                      { discountPercent > 0 && <h2 className="red">Descuento ({ discountPercent }%): ${discount} USD</h2> }
                      <h2>Total: ${total} USD</h2>

                      <Button size="large" type="primary" loading={submitLoading} onClick={this.submitOrder}>Comprar</Button>
                    </div>
                  }
                </Sider>
              </Col>
            </Row>
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
