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

class User(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   name = db.Column(db.String, nullable=False)
   email = db.Column(db.String, nullable=False)
   is_admin = db.Column(db.Boolean, nullable=False, default=False)
   cars = db.relationship('Car', backref = 'user', lazy = True)
   password_hash = db.Column(db.String, nullable=True)

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

class Car(db.Model):
   id = db.Column(db.Integer, primary_key=True)
   make = db.Column(db.String, nullable=False)
   model = db.Column(db.String, nullable=False)
   user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = True)

   def __repr__(self):
      return '<Car {}: {} {}'.format(self.id, self.make, self.model)
   
   def serialize(self, C_Get):
      if C_Get == False:
         return dict(
            id=self.id,
            make=self.make,
            model=self.model,
            user=None if self.user_id is None else User.query.get_or_404(self.user_id).serialize())
      else: return dict(
               id=self.id,
               make=self.make,
               model=self.model)
      
@app.route('/cars', methods=['GET', 'POST'], endpoint='cars')
@jwt_required()
def cars():
   if request.method == 'GET':
      car_list = Car.query.all()
      serialized_cars = [car.serialize(False) for car in car_list]
      return jsonify(serialized_cars)
   elif request.method == 'POST':
        data = request.get_json()

        if 'make' not in data or 'model' not in data:
            abort(400)

        new_car = Car(make=data['make'], model=data['model'])

        if 'user_id' in data:
            if User.query.get(data['user_id']):
               new_car.user_id = data['user_id']

        db.session.add(new_car)
        db.session.commit()

        return jsonify(new_car.serialize(False))

@app.route('/cars/<int:car_id>', methods=['GET', 'PUT', 'DELETE'], endpoint='cars_int')
@jwt_required()
def cars_int(car_id):
   car = Car.query.get_or_404(car_id)
   if request.method == 'GET':
      return jsonify(car.serialize(False))
   elif request.method == 'PUT':
        data = request.get_json()

        if 'make' in data:
            car.make = data['make']
        if 'model' in data:
            car.model = data['model']
        if 'user_id' in data:
            if User.query.get(data['user_id']):
               car.user_id = data['user_id']
            else:
               car.user_id = None

        db.session.commit()

        return jsonify(car.serialize(False))
   elif request.method == 'DELETE':
       db.session.delete(car)
       db.session.commit()
       return jsonify(200) 

@app.route('/cars/<int:car_id>/booking', methods=['POST'], endpoint='car_book')
@jwt_required()
def car_book(car_id):
   car = Car.query.get_or_404(car_id)
   if request.method == 'POST':
      data = request.get_json()  
      if 'user_id' in data:
         if User.query.get(data['user_id']) and car.user_id == None:
            car.user_id = data['user_id']
            db.session.commit()
            return jsonify(True)     
      return jsonify(False)

@app.route('/users', methods=['GET', 'POST'], endpoint='users')
@jwt_required()
def users():
   if request.method == 'GET':
      cus_list = User.query.all()
      serialized_users = [cus.serialize() for cus in cus_list]
      return jsonify(serialized_users)
   elif request.method == 'POST':
        data = request.get_json()

        if 'name' not in data or 'email' not in data:
            abort(400)

        new_cus = User(name=data['name'], email=data['email'])
        db.session.add(new_cus)
        db.session.commit()
        return jsonify(new_cus.serialize())

@app.route('/user/<int:user_id>', methods=['GET', 'PUT', 'DELETE'], endpoint='users_int' )
@jwt_required()
def users_int(user_id):
   cus = User.query.get_or_404(user_id)
   if request.method == 'GET':
      return jsonify(cus.serialize())
   elif request.method == 'PUT':
        data = request.get_json()

        if 'name' in data:
            cus.name = data['name']
        if 'email' in data:
            cus.email = data['email']
        if 'is_admin' in data:
            cus.is_admin = data['is_admin']
        db.session.commit()

        return jsonify(cus.serialize())
   elif request.method == 'DELETE':
       db.session.delete(cus)
       db.session.commit()
       return jsonify(200)     

@app.route('/user/<int:user_id>/cars')
@jwt_required()
def user_cars(user_id):
   cus = User.query.get_or_404(user_id)
   car_list = cus.cars
   serialized_cars = [car.serialize(True) for car in car_list]
   return jsonify(serialized_cars)

@app.route('/sign-up', methods=['POST'])
def user_sign_up():
    data = request.get_json()
    new_cus = User(name=data['name'], email=data['email'])
    new_cus.set_password(data['password'])
    db.session.add(new_cus)
    db.session.commit()
    return jsonify(200)

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
   app.run(port=5423)

   