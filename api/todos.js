import { createClient } from '@supabase/supabase-js';
import supabase from './db-client.js';


async function getAuthedContext(req) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return {
      error: "Unauthorized: missing bearer token"
    };
  }


  const token = authHeader.replace("Bearer ", "");


  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);


  if (error || !user) {
    return {
      error: "Unauthorized: invalid token"
    };
  }


  const client = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      global:{
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    }
  );


  return {
    user,
    client
  };

}



function validateTitle(title){

  if(!title || typeof title !== "string"){
    return "Title is required";
  }

  if(title.trim().length < 3){
    return "Title must be at least 3 characters";
  }


  if(title.trim().length > 150){
    return "Title too long";
  }


  return null;

}



export default async function handler(req,res){


  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );


  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );


  if(req.method==="OPTIONS"){
    return res.status(200).end();
  }



  const auth = await getAuthedContext(req);


  if(auth.error){

    return res.status(401).json({
      success:false,
      message:auth.error
    });

  }


  const {user,client}=auth;



  try{


    if(req.method==="GET"){


      const {data,error}=await client
      .from("todos")
      .select("*")
      .eq("user_id",user.id)
      .order("created_at",
      {
        ascending:false
      });



      if(error) throw error;


      return res.status(200).json(data);

    }




    if(req.method==="POST"){


      const {
        title,
        description
      }=req.body;



      const errorMessage=validateTitle(title);


      if(errorMessage){

        return res.status(400).json({
          success:false,
          message:errorMessage
        });

      }



      const {data,error}=await client
      .from("todos")
      .insert({

        user_id:user.id,
        title:title.trim(),
        description:description || null,
        status:"pending"

      })
      .select()
      .single();



      if(error) throw error;



      return res.status(201).json(data);


    }




    return res.status(405).json({
      success:false,
      message:"Method not allowed"
    });



  }catch(err){


    console.error(err);


    return res.status(500).json({
      success:false,
      message:err.message
    });


  }


}