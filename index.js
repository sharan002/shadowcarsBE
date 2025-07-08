require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const {User} = require("./Schema");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, getDownloadURL, uploadBytesResumable,deleteObject } = require("firebase/storage");

const cors = require("cors");

const corsOptions = {
  origin: ['http://localhost:4200', 'https://shadowcarsfe.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};


app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


const firebaseConfig = {
  apiKey: "AIzaSyC3R8TZeYRZfSkeF3Bb8Fl0vM8KQRYYyac",
  authDomain: "image-upload-10d2f.firebaseapp.com",
  projectId: "image-upload-10d2f",
  storageBucket: "image-upload-10d2f.appspot.com",
  messagingSenderId: "405769010406",
  appId: "1:405769010406:web:5de0d29733990cd2664f27",
  measurementId: "G-X6M5PY7J52"
};

initializeApp(firebaseConfig);
const storage = getStorage();
// const upload = multer({ storage: multer.memoryStorage() });
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads'); 
//   },
//   filename: (req, file, cb) => {
//     // console.log(req.body)
//     cb(null, Date.now() + file.originalname );
//   },
// });

const upload = multer({ storage: multer.memoryStorage() });

// const fs = require('fs');
const path = require('path');
const fs = require('fs/promises');
const PORT = process.env.PORT || 3000;
var nodemailer = require('nodemailer');
 

const { env } = require('process');

// app.use(cors({origin:"*",}));

app.use('/uploads', express.static('uploads'));
mongoose.set('strictQuery',false)


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB',))
.catch((err) => console.error('❌ MongoDB connection error:', err));



app.use(bodyParser.json());
app.use(express.json())

const fileSchema = new mongoose.Schema({
  images : String,
  email: String,
  filename : String,
  brand: String,
  carName: String,
  carModel: String,
  fuelType: String,
  carkilometre: Number,
  carPrice: Number,
  contactDetails: String,
});

const File = mongoose.model('File', fileSchema);

app.post('/upload', upload.single("filename"), async (req, res) => {
  try {
    const file = req.file;
    const filename = file.originalname + " " + Date.now();
    const storageRef = ref(storage, `files/${filename}`);

    const metadata = {
      contentType: file.mimetype,
    };

    const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    const fileDoc = {
      images: downloadURL,
      filename: filename,
      email: req.body.email,
      brand: req.body.brand,
      carName: req.body.carName,
      carModel: req.body.carModel,
      fuelType: req.body.fuelType,
      carkilometre: req.body.carkilometre,
      carPrice: req.body.carPrice,
      contactDetails: req.body.contactDetails,
    };

    console.log(fileDoc)

    await File.create(fileDoc);
    res.status(201).json({ downloadURL: downloadURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading files' });
  }


});

app.post("/login", async (req, res) => {
    const { phone, pass } = req.body;
    console.log(req.body)
    try {
      const user = await User.findOne({ phone });
  
      if (user) {
        if (user.pass === pass) {
        
          res.json({ userExists: true });
        } else {  
          res.status(401).json({ userExists: false, message: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ userExists: false, message: "User not found" });
      }
    } catch (error) {
      console.error("Error querying user:", error);
      res.status(500).send("Error querying user");
    }
  });
  


app.post("/register", (req, res) => {
const { phone, pass,name } = req.body;
    const register = new User({
      phone: req.body.phone,
      pass: req.body.pass, 
      name: req.body.naming,
    });
  
    register.save()
      .then(() => {
        console.log("User saved");
        res.status(201).json({ success: "User saved" });
      })
      .catch((error) => {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  });
  

app.post('/sendemail', (req, res) => {
const {name,phone,email,message } = req.body;
console.log(name,email,message)
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sharan.gisterpages@gmail.com',
    pass: 'iqhl fiqm lxul qcid'
  }
});

var mailOptions = {
  from: '"Sharan Contact Form" <sharan.gisterpages@gmail.com>',
  to: email, 
  subject: 'Contact Form',
  text: `Hey ${name}, 
        Thanks for reaching us we will send updates on ${email} and will reach you on : ${phone} 
        regarding your concern on below request
        Message: ${message}`
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log("not sent")
    res.json({emailsent: false });
    
  } else {
    console.log("sent")
    res.json({ emailsent: true });
  }
});
});





app.get('/files', async (req, res) => {
  
  try {
    const files = await File.find();
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving files' });
  }
});


// const uploadDirectory = path.join(__dirname, 'uploads');

app.delete('/deletecar', async (req, res) => {
  const { email, brand, carName, images, filename,carkilometre } = req.body;
  const storageRef = ref(storage, "files/" + filename);
  try {
    await deleteObject(storageRef); 
  } catch (error) {
    console.error(`Error deleting image: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    const result = await File.findOneAndDelete({ email, brand, carName,carkilometre });

    if (result) {
      return res.status(200).json({ result: true, message: "Image and document deleted successfully" });
    } else {
      return res.status(404).json({ error: 'Document not found' });
    } 
  } catch (error) {
    console.error(`Error deleting document: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/myapp', async (req, res) => {
 console.log("HIII")
 res.status(200).json({ CODE: 'HII BRO' });
});

  // app.listen(PORT, () => {
  //     console.log("listening for requests sharan");
  // })

// app.listen(3000, () => {
//     console.log("Server started on port 3000");
// });
  

  app.listen(PORT, () => {
      console.log("listening for requests sharan");
  })







