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
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );


  return {
    user,
    client
  };

}



function validateTitle(title) {

  if (!title || typeof title !== "string" || !title.trim()) {
    return "Title is required";
  }


  if (title.trim().length < 3) {
    return "Title must be at least 3 characters";
  }


  if (title.trim().length > 150) {
    return "Title must be under 150 characters";
  }


  return null;

}





export default async function handler(req, res) {


  // CORS
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );


  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );


  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );


  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }





  const auth = await getAuthedContext(req);


  if (auth.error) {

    return res.status(401).json({
      success:false,
      message:auth.error
    });

  }



  const {
    user,
    client
  } = auth;




  try {


    // =========================
    // GET TODOS
    // =========================

    if(req.method === "GET") {


      const {
        q,
        status
      } = req.query;



      let query = client
        .from("todos")
        .select("*")
        .eq(
          "user_id",
          user.id
        );



      // Filter status

      if(status) {

        if(
          !["pending","completed"]
          .includes(status)
        ) {

          return res.status(400).json({
            success:false,
            message:"Invalid status"
          });

        }


        query = query.eq(
          "status",
          status
        );

      }




      // Search

      if(q && q.trim()) {

        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%`
        );

      }




      const {
        data,
        error
      } = await query.order(
        "created_at",
        {
          ascending:false
        }
      );



      if(error) throw error;



      return res.status(200).json(data);

    }







    // =========================
    // CREATE TODO
    // =========================

    if(req.method === "POST") {


      const {
        title,
        description
      } = req.body || {};



      const validation =
        validateTitle(title);



      if(validation) {

        return res.status(400).json({
          success:false,
          message:validation
        });

      }




      const {
        data,
        error
      } = await client
        .from("todos")
        .insert({

          user_id:user.id,

          title:title.trim(),

          description:
            description
            ? description.trim()
            : null,

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





  } catch(error) {


    console.error(
      "Todo API Error:",
      error
    );



    return res.status(500).json({

      success:false,

      message:error.message

    });


  }


}