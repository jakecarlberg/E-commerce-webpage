 #!/usr/bin/env python3
from flask import Flask
from flask import jsonify
from flask import abort
from flask import request
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt 
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

app = Flask(__name__, static_folder='../client', static_url_path='/')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'Anjonghaseoo'
db = SQLAlchemy(app)
bcrypt = Bcrypt(app) 
jwt = JWTManager(app)


# Class for User, the seller of the bike and user of account
# The User has attributes describing their info, bikes and sales orders
# As well as the boolean if the said user is an admin, able to approve the
# listing of bikes.
class User(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   name = db.Column(db.String, nullable=False)
   email = db.Column(db.String, nullable=False)
   is_admin = db.Column(db.Boolean, nullable=False, default=False)
   bikes = db.relationship('Bike', backref = 'user', lazy = True)
   password_hash = db.Column(db.String, nullable=True)
   orders = db.relationship('Order', backref='user_orders', lazy=True)

   def __repr__(self):
      return '<user {}: {} {}'.format(self.id, self.name, self.email)
   
   def serialize(self):
      return dict(
          id=self.id, 
          name=self.name, 
          email=self.email,
          is_admin=self.is_admin)
   
   def set_password(self, password):
      self.password_hash = bcrypt.generate_password_hash(password).decode('utf8')

# Class of bike. Describing the attributes of the bike
# Should maybe have a boolean intended to show if the bike is sold
class Bike(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   price = db.Column(db.Integer, nullable=False)
   model = db.Column(db.String, nullable=False)
   is_listed = db.Column(db.Boolean, nullable=False, default=False)  
   user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = True)
   orders = db.relationship('Order', backref='bike_orders', lazy=True)
   description = db.relationship('BikeDescription', backref='bike_description', uselist=False, lazy=True)
   def __repr__(self):
      return '<Bike {}: {} {}'.format(self.id, self.price, self.model)
   
   # C-get might be unnecessary, acts as a way to get or not get the user when fetching the bikes
   def serialize(self, C_Get):
      if C_Get == False:
         return dict(
            id=self.id,
            price=self.price,
            model=self.model,
            is_listed = self.is_listed,
            user=None if self.user_id is None else User.query.get_or_404(self.user_id).serialize(),
            description=self.description.serialize() if self.description else None)
      else: return dict(
               id=self.id,
               price=self.price,
               is_listed = self.is_listed,
               model=self.model,
               description=self.description.serialize() if self.description else None)

# Description for the bike as a weak entity set with bike's is as primary key
class BikeDescription(db.Model):
   bike_id = db.Column(db.Integer, db.ForeignKey('bike.id'), primary_key=True, nullable=False)
   details = db.Column(db.String, nullable=False)
   gears = db.Column(db.Integer, nullable=True) # amount of gears
   condition = db.Column(db.Integer, nullable=True) # Describes condition on a range from 1-5 translating into descriptive words
   age = db.Column(db.Integer, nullable = True)
   #Pictures på något

   def __repr__(self):
      return '<BikeDescription {}: {}>'.format(self.bike_id, self.details, self.gears, self.condition, self.age)

   def serialize(self):
      return dict(
            details=self.details,
            bike_id=self.bike_id,
            gears=self.gears,
            condition=self.condition,
            age=self.age
      )

# Class of Order, to be created and stored when a user successfully sells a bike
# This to store receipts and be able to remove the bike from the bike database   
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    bike_id = db.Column(db.Integer, db.ForeignKey('bike.id'), nullable=False)

    def __repr__(self):
         return '<Order {}: User {} Bike {}'.format(self.id, self.user_id, self.bike_id)

    def serialize(self):
         return dict(
            id=self.id,
            user_id=self.user_id,
            bike_id=self.bike_id
         )

# Route for fetching all bikes   
@app.route('/bikes', methods=['GET', 'POST'], endpoint='bikes')
@jwt_required()
def bikes():
   if request.method == 'GET':
      bike_list = Bike.query.all()
      serialized_bikes = [bike.serialize(False) for bike in bike_list if bike.is_listed]
      return jsonify(serialized_bikes)
   elif request.method == 'POST':
        data = request.get_json()

        if 'price' not in data or 'model' not in data or 'user_id' not in data:
            abort(400)

        new_bike = Bike(price=data['price'], model=data['model'])

         # Probs uneccessary
        if 'user_id' in data:
            if User.query.get(data['user_id']):
               new_bike.user_id = data['user_id']

        #  Mandatory to include a details, gears, condition & age when posting a bike
        #  Values can be null
        if 'details' in data:
            new_bike.description.details = data['details']
        if 'gears' in data:
            new_bike.description.gears = data['gears']
        if 'condition' in data:
            new_bike.description.condition = data['condition']
        if 'age' in data: 
            new_bike.description.age = data['age'] 

        db.session.add(new_bike)
        db.session.commit()

        return jsonify(new_bike.serialize(False))

# Route for fetching one specific bike
@app.route('/bikes/<int:bike_id>', methods=['GET', 'PUT', 'DELETE'], endpoint='bikes_int')
@jwt_required()
def bikes_int(bike_id):
   bike = Bike.query.get_or_404(bike_id)
   if request.method == 'GET':
      return jsonify(bike.serialize(False))
   elif request.method == 'PUT':
        data = request.get_json()

        if 'price' in data:
            bike.price = data['price']
        if 'is_listed' in data:
            bike.is_listed = data['is_listed']
        if 'model' in data:
            bike.model = data['model']
        if 'user_id' in data:
            if User.query.get(data['user_id']):
               bike.user_id = data['user_id']
            else:
               bike.user_id = None

        db.session.commit()

        return jsonify(bike.serialize(False))
   elif request.method == 'DELETE':
       db.session.delete(bike)
       db.session.commit()
       return jsonify(200) 

# Route for adding and fetching sellers
@app.route('/users', methods=['GET', 'POST'], endpoint='users')
@jwt_required()
def users():
   if request.method == 'GET':
      user_list = User.query.all()
      serialized_users = [user.serialize() for user in user_list]
      return jsonify(serialized_users)
   
   # Onödig post
   elif request.method == 'POST':
        data = request.get_json()

        if 'name' not in data or 'email' not in data:
            abort(400)

        new_user = User(name=data['name'], email=data['email'])
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.serialize())

# Route for fetching, editing and deleting a user. (Not really necessary)
@app.route('/user/<int:user_id>', methods=['GET', 'PUT', 'DELETE'], endpoint='users_int' )
@jwt_required()
def users_int(user_id):
   user = User.query.get_or_404(user_id)
   if request.method == 'GET':
      return jsonify(user.serialize())
   elif request.method == 'PUT':
        data = request.get_json()

        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        db.session.commit()

        return jsonify(user.serialize())
   elif request.method == 'DELETE':
       db.session.delete(user)
       db.session.commit()
       return jsonify(200)     

# Fetching a sellers listed bikes (uneccessary)
@app.route('/user/<int:user_id>/bikes')
@jwt_required()
def user_bikes(user_id):
   user = User.query.get_or_404(user_id)
   bike_list = user.bikes
   serialized_bikes = [bike.serialize(True) for bike in bike_list]
   return jsonify(serialized_bikes)

# Function for posting and fetching orders
@app.route('/orders', methods=['GET', 'POST'], endpoint='orders')
@jwt_required()
def orders():
   if request.method == 'GET':
      order_list = Order.query.all()
      serialized_orders = [order.serialize() for order in order_list]
      return jsonify(serialized_orders)
   elif request.method == 'POST':
        data = request.get_json()

        if 'user_id' not in data or 'bike_id' not in data:
            abort(400)

        new_order = Order(user_id=data['user_id'], bike_id=data['bike_id'])
        db.session.add(new_order)
        db.session.commit()
        return jsonify(new_order.serialize())

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

@app.route("/")
def client():
  return app.send_static_file("client.html")

if __name__ == "__main__":
   app.run(port=5223)

   