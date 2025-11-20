import pkg from 'pg'
const {Pool}=pkg

export const pool = new Pool(
    {
        user:'postgres',
        host:'localhost',
        port:'5433',
        password:'hammad',
        database:'chatbotdb',
        search_path: "chatbot"
    }
)