 #!/usr/bin/env python3
from flask import Flask
from flask import current_app
from flask import jsonify
from flask import abort
from flask import request
from flask import redirect
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt 
from flask import url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.utils import secure_filename
import os
import stripe #also download stripe  $ pip3 install stripe
import logging

stripe.api_key = 'sk_test_51Oy9c5B4pUMRNsNp2NFcjy4pgPUbnkiy1kLbK3S8C02rSASCE2BMbA2r44mf3CytleUpuTeZhmZbpPdgfk8JBdwS004EgfeYYq'

app = Flask(__name__, static_folder='../client', static_url_path='/')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'Anjonghaseoo'
db = SQLAlchemy(app)
bcrypt = Bcrypt(app) 
jwt = JWTManager(app)

# Class for User, the seller of the bike and user of account
# The User has attributes describing their info, bikes, and sales orders
# As well as the boolean if the said user is an admin, able to approve the
# listing of bikes
class User(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   name = db.Column(db.String, nullable=False)
   email = db.Column(db.String, nullable=False)
   is_admin = db.Column(db.Boolean, nullable=False, default=False)
   password_hash = db.Column(db.String, nullable=True)
   bikes = db.relationship('Bike', backref = 'user', lazy = True) # Bikes for sale or sold for seller
   orders = db.relationship('Order', backref='user_orders', lazy=True) # Completed purchases as buyer

   def __repr__(self):
      return '<User {}: Name {} Email {}'.format(self.id, self.name, self.email)
   
   def serialize(self):
      return dict(
          id=self.id, 
          name=self.name, 
          email=self.email,
          is_admin=self.is_admin)
   
   def set_password(self, password):
      self.password_hash = bcrypt.generate_password_hash(password).decode('utf8')

# Class of bike. Describing the attributes of the bike-order
class Bike(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   price = db.Column(db.Integer, nullable=False)
   model = db.Column(db.String, nullable=False)
   is_listed = db.Column(db.Boolean, nullable=False, default=False)  
   is_sold = db.Column(db.Boolean, nullable=False, default=False)  
   seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = True) # Id of seller
   orders = db.relationship('Order', backref='bike_orders', lazy=True) # Completed sale
   gears = db.Column(db.Integer, nullable=True) # Amount of gears
   condition = db.Column(db.Integer, nullable=True) # Describes condition on a range from 1-5 translating into descriptive words
   age = db.Column(db.Integer, nullable = True)
   picture_path = db.Column(db.String, nullable=False, default='')

   def __repr__(self):
      return '<Bike {}: Price {} Model {}'.format(self.id, self.price, self.model)
   
   def serialize(self):
      return dict(
         id = self.id,
         price = self.price,
         is_listed = self.is_listed,
         is_sold = self.is_sold,
         model = self.model,
         gears = self.gears,
         condition = self.condition,
         age = self.age,
         picture_path=self.picture_path,
         seller_id = self.seller_id
      )

# Class of Order, to be created and stored when a user successfully sells a bike
# This to store receipts and be able to remove the bike from the bike database   
class Order(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
   bike_id = db.Column(db.Integer, db.ForeignKey('bike.id'), nullable=False)
   seller_paid = db.Column(db.Boolean, nullable=False, default=False) 

   def __repr__(self):
      return '<Order {}: Buyer {} Bike {} Seller paid {}'.format(self.id, self.buyer_id, self.bike_id, self.seller_paid)

   def serialize(self):
      return dict(
         id=self.id,
         buyer_id=self.buyer_id,
         bike_id=self.bike_id,
         seller_paid = self.seller_paid
      )
   
# Class of Message, to store messages send by users and non-users to be read by Admin
class Message(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   name = db.Column(db.String, nullable=False)
   email = db.Column(db.String, nullable=False)
   message = db.Column(db.String, nullable=False)

   def __repr__(self):
      return '<ID {}: Name {} E-mail {} Message {}'.format(self.id, self.name, self.email, self.message)
   
   def serialize(self):
      return dict(
          id=self.id, 
          name=self.name, 
          email=self.email,
          message=self.message)


# Route for fetching all bikes   
@app.route('/bikes', methods=['GET'])
def bikes():
   if request.method == 'GET':
      bike_list = Bike.query.all()
      serialized_bikes = [bike.serialize() for bike in bike_list ] 
      return jsonify(serialized_bikes)
     

# Route for fetching one specific bike
# We save all sold bikes to be accessed by sellers and buyers in their purchase history, 
# therefore no bikes can be deleted from the database if they have been sold
@app.route('/bikes/<int:bike_id>', methods=['GET', 'PUT', 'DELETE'])
# @jwt_required() we want this only for DELETE and PUT but not for GET
def bikes_int(bike_id):
   bike = Bike.query.get_or_404(bike_id)
   if request.method == 'GET':
      return jsonify(bike.serialize())
   
   elif request.method == 'PUT':
      data = request.get_json()
      if bike.seller_id == data['user_id']:
         if 'price' in data:
            bike.price = data['price']
         if 'model' in data:
            bike.model = data['model']
         if 'user_id' in data:
            if User.query.get(data['user_id']):
               bike.user_id = data['user_id']
            else:
               bike.user_id = None
      if 'is_listed' in data:
         bike.is_listed = data['is_listed']
      db.session.commit()
      return jsonify(bike.serialize())
      
   elif request.method == 'DELETE':
      db.session.delete(bike)
      db.session.commit()
      return jsonify(200) 


# Route for fetching all users (they can be both sellers and buyers)
# Will this be used?
@app.route('/users', methods=['GET'], endpoint='users')
@jwt_required()
def users():
   if request.method == 'GET':
      user_list = User.query.all()
      serialized_users = [user.serialize() for user in user_list]
      return jsonify(serialized_users)

# Route for fetching, editing and deleting a user
# For editing your profile
   
# When deliting your profile you must ensurte that the relationship to orders and bikes are edited. 
# If there is an order on the bikes the deleted user is selling, the bike remains in the database, 
# however if there isn't an order the bike can be deleted.
@app.route('/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def users_int(user_id):
   user = User.query.get_or_404(user_id)
   if request.method == 'GET':
      return jsonify(user.serialize())
   
   elif request.method == 'PUT':
      data = request.get_json()
      if user_id == data['user_id']:
         if 'name' in data:
            user.name = data['name']
         if 'email' in data:
            user.email = data['email']
         if 'is_admin' in data:
            user.is_admin = data['is_admin']
         db.session.commit()
         return jsonify(user.serialize()), 200
   
   elif request.method == 'DELETE':
      data = request.get_json()
      if user_id == data['user_id']:
         bike_list = user.bikes.query.all() # Deleting the relationship between the bike and the seller
         for bike in bike_list:
            bike.seller_id = None
         order_list = user.orders.query.all() # Deleting the relationship between the order and the buyer
         for order in order_list:
            order.buyer_id = None

         db.session.delete(user) # Delete the user
         db.session.commit()
         return jsonify({'message': 'User deleted successfully'}), 200    

# Fetching a sellers listed bikes
@app.route('/users/<int:user_id>/bikes', methods=['GET', 'POST'])
@jwt_required()
def user_bikes(user_id):
   user = User.query.get_or_404(user_id)
   if request.method == 'GET':
      bike_list = user.bikes
      serialized_bikes = [bike.serialize() for bike in bike_list]
      return jsonify(serialized_bikes)
   
   elif request.method == 'POST':
      data = request.form
      if 'price' not in data or 'model' not in data:
         abort(400)
      adjustedPrice = int(data['price'])+50
      new_bike = Bike(price=str(adjustedPrice), model=data['model'])
      new_bike.seller_id = user_id

      if 'gears' in data:
         new_bike.gears = data['gears']
      if 'condition' in data:
         new_bike.condition = data['condition']
      if 'age' in data: 
         new_bike.age = data['age'] 
      picture_file = request.files.get('picture')
      if picture_file:
         picture_filename = secure_filename(picture_file.filename)  # Secure filename to prevent directory traversal
         parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
         picture_path = os.path.join(parent_dir, 'client', picture_filename)
         picture_file.save(picture_path)  # Save the picture to the specified path
         new_bike.picture_path = picture_filename  # Save the filename in the database
         try:
            db.session.add(new_bike)
            db.session.commit()
         except:
            abort(500)  # Indicate that something went wrong with HTTP status c
      return jsonify(new_bike.serialize())

# Fetching a buyers purchased orders
@app.route('/users/<int:user_id>/orders')
@jwt_required()
def user_orders(user_id):
   user = User.query.get_or_404(user_id)
   order_list = user.orders
   serialized_bikes = [Bike.query.filter_by(id=order.bike_id).first().serialize() for order in order_list]
   return jsonify(serialized_bikes)

# Function for fetching all completed orders and creating a new order
@app.route('/orders', methods=['GET', 'POST', 'DELETE'])
# @jwt_required()
def orders():
   if request.method == 'GET':
      order_list = Order.query.all()
      serialized_orders = [order.serialize() for order in order_list]
      return jsonify(serialized_orders)
   
   elif request.method == 'POST':

      data = request.get_json()
      if 'bike_id' not in data:
         abort(400)

      bike = Bike.query.get_or_404(data['bike_id'])
      bike.is_sold = True 
      bike.is_listed = False

      if (data['buyer_id'] == None):
         user = User.query.filter_by(name='unidentified').first()
         buyer_identity = user.id
      else: 
         buyer_identity = data['buyer_id']

      new_order = Order(buyer_id=buyer_identity, bike_id=data['bike_id'])

      db.session.add(new_order)
      db.session.commit()
      return jsonify(new_order.serialize())
  
   elif request.method == 'DELETE':
      latest_order = Order.query.order_by(Order.id.desc()).first()
      bike = Bike.query.get_or_404(latest_order.bike_id)
      bike.is_sold = False
      bike.is_listed = True

      db.session.delete(latest_order)
      db.session.commit()
      return jsonify(latest_order.serialize())

# Signing up as a user
@app.route('/sign-up', methods=['POST'])
def user_sign_up():
   data = request.get_json()
   new_user = User(name=data['name'], email=data['email'])
   new_user.set_password(data['password'])
   db.session.add(new_user)
   db.session.commit()
   return jsonify(200)

# Logging in as a user
@app.route('/login', methods =['POST'])
def login():
   data = request.get_json()
   user = User.query.filter_by(email=data['email']).first()
   if user is None:
      abort(401)
   if bcrypt.check_password_hash(user.password_hash, data['password']):
      access_token = create_access_token(identity=user.id)
      response = {
         'token': access_token,
         'user': user.serialize()
      }      
      return jsonify(response)
   else:
      abort(401)

# Function for fetching all messages and creating a new message
@app.route('/messages', methods=['GET', 'POST'])
def messages():
   if request.method == 'GET':
      messages_list = Message.query.all()
      serialized_messages = [message.serialize() for message in messages_list]
      return jsonify(serialized_messages)
   elif request.method == 'POST':
      data = request.get_json()
      new_message = Message(name=data['name'], email=data['email'], message=data['message'])
      db.session.add(new_message)
      db.session.commit()
      return jsonify(new_message.serialize())

@app.route("/")
def client():
   return app.send_static_file("client.html")

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
   data = request.get_json()
   try:
        bike = Bike.query.get_or_404(data['bike_id'])
        price = bike.price
        checkout_session = stripe.checkout.Session.create(
            line_items=[
               {
                  'price_data': {
                     'currency': 'sek',
                     'unit_amount': price * 100,  # Stripe requires amount in cents
                     'product_data': {
                           'name': bike.model,  # Assuming you have a field 'model' in your Bike model
                     },
                  },
                  'quantity': 1,  # Assuming quantity is always 1 for a bike
               },
            ],
            mode='payment',
            success_url=request.host_url + '/success.html',
            cancel_url=request.host_url + '/cancel.html',
        )
   except Exception as e:
        return str(e)
   return checkout_session.url

if __name__ == "__main__":
   app.run(port=5000)

   