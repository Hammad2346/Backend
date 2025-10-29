import pkg from 'pg'
const {Pool}=pkg

export const pool = new Pool(
    {
        user:'hammad',
        host:'localhost',
        port:'5432',
        password:'secret',
        database:'chatbotdb'
    }
)