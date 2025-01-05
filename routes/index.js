var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const models = require('../db/models')
const UserModel = models.UserModel
const ChatModel = models.ChatModel
const filter = {password: 0}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/register', async (req, res, next) => {
        try {
            const {username, password, type} = req.body
            // console.log(`username is ${username},password is ${password},type is ${type}`)
            const user = await UserModel.findOne({username})
            const randomHeader = Math.floor(Math.random() * 20) + 1;
            setTimeout(async () => {
                if (user) {
                    return res.send({code: 1, msg: '用户已存在'})
                }
                const newUser = new UserModel({username: username, password: md5(password), type, header: randomHeader})
                const savedUser = await newUser.save()
                res.cookie('userid', savedUser._id.toString(), {maxAge: 1000 * 60 * 60 * 24 * 7})
                res.send({code: 0, data: {_id: savedUser._id, username, type}})
            }, 20)
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).send({code: 1, msg: '服务器错误' + err.message});
        }
    }
)

router.post('/login', async (req, res) => {
    try {
        const {username, password} = req.body
        const user1 = await UserModel.findOne({username}, filter)
        if (!user1) {
            return res.send({code: 1, msg: '用户不存在'})
        }

        const user = await UserModel.findOne({username, password: md5(password)}, filter)

        setTimeout(() => {
            if (!user) {
                return res.send({code: 1, msg: '密码错误'})
            }
            res.cookie('userid', user._id.toString(), {maxAge: 1000 * 60 * 60 * 24 * 7})
            res.send({code: 0, data: user})
        }, 20)
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send({code: 1, msg: '服务器错误' + err.message});
    }
})

router.post('/deleteUser', async (req, res, next) => {
        try {
            const userid = req.cookies.userid
            if (!userid) {
                return res.send({code: 1, msg: '请先登录'})
            }

            const result = await UserModel.deleteOne({_id: userid})
            setTimeout(async () => {
                // 检查是否成功删除
                if (result.deletedCount === 0) {
                    return res.status(404).send({code: 1, msg: '用户不存在或已删除'});
                }
                res.clearCookie('userid')
                res.send({code: 0, msg: '用户已成功注销', data: null});
            }, 20)
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).send({code: 1, msg: '服务器错误' + err.message});
        }
    }
)

router.post('/update', async (req, res) => {
    try {
        const userid = req.cookies.userid
        if (!userid) {
            return res.send({code: 1, msg: '请先登录'})
        }

        // const user = await UserModel.findByIdAndUpdate(userid, req.body, {new: true})
        const existingUser = await UserModel.findById(userid);
        // console.log(`existinguser is ${JSON.stringify(existingUser)}`)
        if (!existingUser) {
            throw new Error("更新失败，用户未找到");
        }
        // console.log(`req.body is ${JSON.stringify(req.body)}`)
        // 合并现有数据和 req.body，保留数据库中非空字段
        let requestBody = Object.fromEntries(Object.entries(req.body).filter(([_, value]) => value !== null && value !== undefined))
        // console.log(`requestBody is ${JSON.stringify(requestBody)}`)
        const updatedData = {...existingUser.toObject(), ...Object.fromEntries(Object.entries(req.body).filter(([_, value]) => value !== null && value !== undefined && value !== '')),}; // 更新用户数据
        // const user = await UserModel.findByIdAndUpdate(userid, updatedData, {new: true});
        const user = await UserModel.findByIdAndUpdate(userid, updatedData, {new: true});
        // console.log("Updated user:", user);
        if (user) {
            const {_id, username, type, header} = user
            const data = Object.assign(req.body, {_id, username, type, header})
            return res.send({code: 0, data})
        }
        res.send({code: 1, msg: '更新失败，用户未找到'})
    } catch (e) {
        console.error('Error during update:', e);
        res.status(500).send({code: 1, msg: '服务器错误' + e.message});
    }
})

router.get('/user', async (req, res) => {
    try {
        const userid = req.cookies.userid
        if (!userid) {
            return res.send({code: 1, msg: '请先登录'})
        }
        // console.log(`user id is ${userid}`)
        const user = await UserModel.findOne({_id: userid}, filter)
        setTimeout(() => {
            if (user) {
                // console.log(`user is ${JSON.stringify(user)}`)
                return res.send({code: 0, data: user})
            }
            res.send({code: 1, msg: '查询失败，用户未找到'})
        }, 20)
    } catch (e) {
        console.error('Error during query user:', e);
        res.status(500).send({code: 1, msg: '服务器错误' + e.message});
    }
})

router.get('/allLaobans', async (req, res) => {
    try {
        const userid = req.cookies.userid
        if (!userid) {
            return res.send({code: 1, msg: '请先登录'})
        }
        const laobans = await UserModel.find({type: 'laoban'}, filter)
        setTimeout(() => {
            if (laobans) {
                return res.send({code: 0, data: laobans})
            }
            res.send({code: 1, msg: '查询失败，老板未找到'})
        }, 20)
    } catch (e) {
        console.error('Error during query user:', e);
        res.status(500).send({code: 1, msg: '服务器错误' + e.message});
    }
})

router.get('/allDashens', async (req, res) => {
    try {
        const userid = req.cookies.userid
        if (!userid) {
            return res.send({code: 1, msg: '请先登录'})
        }
        const dashens = await UserModel.find({type: 'dashen'}, filter)
        // console.log(`dashens is ${JSON.stringify(dashens)}`)
        setTimeout(() => {
            if (dashens) {
                return res.send({code: 0, data: dashens})
            }
            res.send({code: 1, msg: '查询失败，求职者未找到'})
        }, 20)
    } catch (e) {
        console.error('Error during query user:', e);
        res.status(500).send({code: 1, msg: '服务器错误' + e.message});
    }
})


// 获取当前用户所有相关聊天信息列表
router.get('/msglist', async (req, res) =>{
    try {
        // 获取 cookie 中的 userid
        const userid = req.cookies.userid
        if (!userid) {
            return res.status(401).send('No userid cookie, please login first')
        }
        // 查询得到所有 user 文档数组
        const userDocs=await UserModel.find()
        const users = {} // 对象容器
        userDocs.forEach(doc => {
            users[doc._id] = {username: doc.username, header: doc.header}
        })
        const chatMsgs=await ChatModel.find({'$or': [{from: userid}, {to: userid}]},filter)
        res.send({code: 0, data: {users, chatMsgs}})
    }catch (e){
        console.error('Error during msglist:', e);
        res.status(500).send({code: 1, msg: '服务器错误' + e.message});
    }
})

// 修改指定消息为已读
router.post('/readmsg', function (req, res) {
    // 得到请求中的 from 和 to
    const from = req.body.from
    const to = req.cookies.userid
    /*更新数据库中的 chat 数据
    参数 1: 查询条件
    参数 2: 更新为指定的数据对象
    参数 3: 是否1次更新多条, 默认只更新1条
    参数 4: 更新完成的回调函数
    */
    ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err, doc) {
        console.log('/readmsg', doc)
        res.send({code: 0, data: doc.nModified}) // 更新的数量
    })
})

module.exports = router;
