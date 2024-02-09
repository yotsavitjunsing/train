let express = require('express');
let cors = require('cors');
let app =express();
let bodyParser = require('body-parser');
let jsonParser = bodyParser.json();
const genpass = 10;
let jwt =require('jsonwebtoken');
const secret ='Fullstack-login-2021';
let md5 = require('md5');
require('dotenv').config();
app.use(cors())
const mysql = require('mysql2');


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user:process.env.DB_USER,
    database:process.env.DB_NAME,
    password:process.env.DB_PASS,
    port: 3306
});


app.post('/register-api',jsonParser,function(req,res,next){
        let password =req.body.password;
        let hash_pass2 = md5(password);
      
                connection.execute(
           
                    'INSERT INTO customers (customers.cus_name,customers.cus_email,customers.`password`) VALUES (?,?,?)',[req.body.name,req.body.email,hash_pass2],
                    function (err,results,fields)
                    {if(err)
                        {
                            res.json({status: 'error',message: err})
                            return;
                        }
                        res.json({state:'success',message:"register success"});
            
                    }
                )
               })
        
    
    

app.post('/forgotpass',jsonParser,function(req,res,next){
    
});


app.post('/login-api',jsonParser,function(req,res,next){
        let passwordL =req.body.password;
        let hash_pass2L = md5(passwordL);
        let email = req.body.email
         hash_pass2L = hash_pass2L.substring(0, 30);
    connection.execute(
        'SELECT * FROM customers WHERE customers.cus_email = ?',[req.body.email],
        function(err,users,fields){
            if(err) {res.json({state:'error',message: err}); return}
            if(users.length == 0)  {res.json({status:'error',message:'no have user'}); return}
            console.log(hash_pass2L);
            const tokens = jwt.sign({email,role:'admim'},'private--garden',{expiresIn:'24h'})
            const cus_id = users[0].cus_id;
            if(hash_pass2L == users[0].password)
            {
                res.json({status:'valid',message: 'success login',tokens,cus_id})
            }
            else {res.json({status:'unvalid',message: 'unsuccess login'})}

            
           
            
        }
    )
});
app.post('/authenize',jsonParser,(req,res,next)=>{
    
    try
        {   
        let tokenn = req.headers.authorization.split(' ')[1];
        tokenn=tokenn.slice(1,-1);
        let tokendecode = jwt.verify(tokenn,'private--garden')
        res.json({status:'authen success',emailintoken:tokendecode.email});   
        }
   catch(error)
        {
        
        res.json({status:'error',message:'not authen'});
        }
    
    
});    
        
app.get('/address-info/:cus_email', function(req, res, next) {
    const cus_email = req.params.cus_email;

    connection.query(
        "SELECT address.address_id,address.house_num,address.village,address.vilth_name,address.vileng_name,subdistrict.postcode,subdistrict.namesub_th,district.nameth,provinces.name_thai,geographies.name_geo FROM address_cus INNER JOIN customers ON address_cus.cus_id= customers.cus_id INNER JOIN address ON address_cus.address_id =address.address_id JOIN  subdistrict ON subdistrict.subdis_id= address.subdis_id INNER JOIN  district ON subdistrict.district_id= district.district_id INNER JOIN provinces ON provinces.provinces_code= district.provinces_code INNER JOIN geographies ON provinces.id_geo= geographies.id_geo WHERE  cus_email =?",
        [cus_email],
        function(err, addressData) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', addressData });
        }
    );
});  
app.get('/address-info-profile/:cus_email',function(req,res,next){
const cus_email = req.params.cus_email
connection.query(
    'SELECT * FROM  customers where cus_email = ? ',[cus_email],
    function(err,data){
        if(err){
            return res.json({status:'error',message:'try again'})
        }
        res.json({status:'success' ,data});
    }
)
});
app.get('/address-info-profile-phone/:cus_id',function(req,res){
    const cus_id = req.params.cus_id
    connection.query(
        'SELECT * FROM phonenumber where cus_id=?',[cus_id],
        function(err,data){
            if(err){
                return res.json({status:'error',data})
            }
            res.json({status:'success',data});
        }
    )
})
app.put('/update-customer-name/:cus_id', jsonParser, function(req, res, next) {
    const cus_id = req.params.cus_id;
    const { name } = req.body;

    connection.execute(
        'UPDATE customers SET cus_name = ? WHERE cus_id = ?',
        [name,cus_id],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Customer information updated successfully.' });
        }
    );
});
app.put('/update-address-profile/:email/:index', jsonParser, function(req, res, next) {
    const index = req.params.index;
    const email =req.params.email;
    const { house_num } = req.body;
    

    // Update address information based on the specified index and customer email
    connection.execute(
        ' UPDATE address SET address.house_num=? WHERE address.address_id=(SELECT  address_cus.address_id FROM address_cus INNER JOIN customers ON  address_cus.cus_id =customers.cus_id  WHERE customers.cus_email = ? LIMIT ?,1)',
        [house_num,email,index],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Address information updated successfully.' });
        }
    );
});

app.get('/recieve_geo',jsonParser,function(req,res){
    connection.query(
        'SELECT * FROM geographies',
        function(err,data){
            if(err){
                return res.json({status:'error',data})
            }
            res.json({status:'success',data});
        }
    )

});
app.put('/update-address-alterall/:email/:index', jsonParser, function(req, res, next) {
    const index = req.params.index;
    const email =req.params.email;
    const { sub_dist } = req.body;
    

    // Update address information based on the specified index and customer email
    connection.execute(
        ' UPDATE address SET address.subdis_id= ? WHERE address.address_id = (SELECT address_cus.address_id FROM address_cus INNER JOIN customers ON address_cus.cus_id = customers.cus_id INNER JOIN address ON address.address_id = address_cus.address_id  WHERE customers.cus_email =?  LIMIT ?,1)',
        [sub_dist,email,parseInt(index)],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Address information updated successfully.' });
        }
    );
});
app.get('/recieve_provinces',jsonParser,function(req,res){
    const { geo_name } = req.query;;
    connection.query(
        'SELECT provinces.name_thai FROM geographies INNER JOIN provinces ON provinces.id_geo =geographies.id_geo WHERE  geographies.name_geo = ?',[geo_name],
        function(err,data){
            if(err){
                return res.json({status:'error',data})
            }
            res.json({status:'success',data});
        }
    )

});
app.get('/recieve_distisct',jsonParser,function(req,res){
    const { provinces_name } = req.query;;
    connection.query(
        'SELECT district.nameth FROM provinces INNER JOIN district ON provinces.provinces_code =district.provinces_code WHERE  provinces.name_thai =?',[ provinces_name],
        function(err,data){
            if(err){
                return res.json({status:'error',data})
            }
            res.json({status:'success',data});
        }
    )

});
app.get('/recieve_subdistisct',jsonParser,function(req,res){
    const { distisct_name } = req.query;
    connection.query(
        'SELECT subdistrict.subdis_id,subdistrict.namesub_th FROM district INNER JOIN subdistrict ON subdistrict.district_id =district.district_id WHERE  district.nameth =?',[ distisct_name],
        function(err,data){
            if(err){
                return res.json({status:'error',data})
            }
            res.json({status:'success',data});
        }
    )

});
     
app.put('/update-address-village/:email/:index', jsonParser, function(req, res, next) {
    const index = req.params.index;
    const email =req.params.email;
    const { village,village_th,village_eng } = req.body;
    

    // Update address information based on the specified index and customer email
    connection.execute(
        'UPDATE address SET address.village=?,address.vilth_name=?,address.vileng_name=? WHERE address.address_id = (SELECT address_cus.address_id FROM address_cus INNER JOIN customers ON address_cus.cus_id = customers.cus_id INNER JOIN address ON address.address_id = address_cus.address_id  WHERE customers.cus_email =?  LIMIT ?,1)',
        [village,village_th,village_eng,email,index],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Address information updated successfully.' });
        }
    );
});   
app.post('/insert-address-input', jsonParser, function(req, res, next) {
    const { house_num, id_geo, village, vilth_name, vileng_name, subdis_id } = req.body;

    connection.execute(
        'INSERT INTO address (house_num, id_geo, village, vilth_name, vileng_name, subdis_id) VALUES (?, ?, ?, ?, ?, ?)',
        [house_num, id_geo, village, vilth_name, vileng_name, subdis_id],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            const addressId = results.insertId; // ดึงค่า address_id ที่ได้จากการ INSERT

            // ทำการ INSERT INTO address_cus โดยใช้ addressId ที่ได้
            connection.execute(
                'INSERT INTO address_cus (cus_id, address_id) VALUES (?, ?)',
                [req.body.cus_id, addressId],
                function(err, results, fields) {
                    if (err) {
                        return res.json({ status: 'error', message: err });
                    }

                    res.json({ status: 'success', message: 'Address and address_cus inserted successfully.' });
                }
            );
        }
    );
});     
app.delete('/delete-address/:address_id', function(req, res, next) {
    const addressId = req.params.address_id;

    connection.execute(
        'DELETE FROM address_cus WHERE address_id = ?',
        [addressId],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            // เมื่อลบข้อมูลจาก address_cus เสร็จแล้ว ลบข้อมูลในตาราง address
            connection.execute(
                'DELETE FROM address WHERE address_id = ?',
                [addressId],
                function(err, results, fields) {
                    if (err) {
                        return res.json({ status: 'error', message: err });
                    }

                    res.json({ status: 'success', message: 'Address and address_cus deleted successfully.' });
                }
            );
        }
    );
});
app.post('/add-phone-number', jsonParser, function(req, res, next) {
    const { phone_num, cus_id } = req.body;
    connection.execute(
        'INSERT INTO phonenumber (phone_num, cus_id) VALUES (?, ?)',
        [phone_num, cus_id],
        function(err, results, fields) {
            if (err) {
                return res.status(500).json({ status: 'error', message: err });
            }

            res.status(201).json({ status: 'success', message: 'Phone number added successfully' });
        }
    );
});
app.put('/update-address-phone/:phone_num', jsonParser, function(req, res, next) {
    const phone_num = req.params.phone_num;
    
    const { phone_new } = req.body;
    

    // Update address information based on the specified index and customer email
    connection.execute(
        'UPDATE phonenumber SET phonenumber.phone_num=? WHERE phonenumber.phone_num= ?',
        [phone_new ,phone_num],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Address information updated successfully.' });
        }
    );
});      

app.delete('/delete/phonenum/:phone_num',jsonParser,function(req,res){
    const phonenum =req.params.phone_num;
    connection.execute(
        'DELETE FROM phonenumber WHERE phonenumber.phone_num = ?',[phonenum],
        function(err, results, fields) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', message: 'Address information updated successfully.' });
        }
    )
})
app.get('/product-by-sub-id-and-index/:product_sub_id/:index', function(req, res, next) {
    const productSubId = req.params.product_sub_id;
    const index = req.params.index;

    connection.query(
        'SELECT * FROM products WHERE products.product_sub_id = ? LIMIT ?,1',
        [productSubId, parseInt(index)],
        function(err, productData) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', productData });
        }
    );
});
app.get('/products-by-sub-id/:product_sub_id', function(req, res, next) {
    const product_sub_id = req.params.product_sub_id;

    connection.query(
        'SELECT * FROM products WHERE products.product_sub_id = ?',
        [product_sub_id],
        function(err, productData) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', productData });
        }
    );
});
app.get('/products-by-id/:product_id', function(req, res, next) {
    const product_id = req.params.product_id;

    connection.query(
        'SELECT * FROM  subproduct_type WHERE subproduct_type.products_type_id =?',
        [product_id],
        function(err, productData) {
            if (err) {
                return res.json({ status: 'error', message: err });
            }

            res.json({ status: 'success', productData });
        }
    );
});


app.listen(3333,function(){
    console.log('connect to server port 3333');
});