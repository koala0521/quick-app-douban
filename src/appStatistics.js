import storage from '@system.storage' 
import nativeFetch from '@system.fetch'
import device from '@system.device'

import app from '@system.app'
import router from '@system.router'

// import '../node_modules/fingerprintjs2/fingerprint2.js';

//调试提示
import prompt from '@system.prompt'

// 服务器地址
const SERVER_URL = 'https://api.douban.com';

// 测试  /v2/movie/top250?count=20

//  请求封装
const NETWORK = {

    'fetch':function( args ){

        let url = SERVER_URL + args.url;
        let obj = {
            url:SERVER_URL + args.url,
            fail:function(data, code){
                console.log(`请求失败, code = ${code}`);
            }
        };

        Object.assign( obj , args , { url } )
        nativeFetch.fetch(obj);
    },
    'get':function( args ){

        args.method = "GET";
        return this.fetch(args);
    },
    'post':function( args ){

        args.method = "POST";
        return this.fetch(args);
    }
} 


const APP_STATISTICS = {

    'AC_data':{
        // 应用包名：应用的唯一标识
        'package':'',

        // 来源平台
        'packageName':'',

        'name':'',

        'deviceId':'',
        
        'macId':'',
        
        'userId':'',
        // 广告id
        'advertising':'',

        // 进入app的时间
        'createTime':'',
        // 离开app的时间
        
        'destroyTime':''
    },

    // 设备信息
    'AC_deviceInfo':null,
    // 打开app
    createApp( deviceData ){
        const APP = deviceData || { 'options':{} , '_def':{} };
        
        let d = new Date;
        // 解构出  env 和 manifest 对象
        let { options:{ env } , _def:{ manifest } } = APP;
        // 获取当前应用信息
        let { source } = app.getInfo();
        
        console.log( ' 获取当前应用信息 >>>>' , JSON.stringify( source ) );

        APP_STATISTICS.AC_data.packageName = source.packageName;

        // 进入时间 待确认是否用前端时间 ？
        APP_STATISTICS.AC_data.createTime = d.getTime() + '';

        // 获取应用包名
        APP_STATISTICS.AC_data.package = manifest.package;
        
        // 获取应用名称
        APP_STATISTICS.AC_data.name = manifest.name;

        // 读取设备id和用户id
        device.getId({
            type: ['device', 'mac','user', 'advertising'], // 最少一个，最多四个
            success: function (data) {

                APP_STATISTICS.AC_data.deviceId = data.device;
                APP_STATISTICS.AC_data.macId = data.mac;
                APP_STATISTICS.AC_data.userId = data.user;
                APP_STATISTICS.AC_data.advertisingId = data.advertising;

                // 查看获取到的信息
                // console.log( '查看获取到的信息 >>>>' , JSON.stringify( APP_STATISTICS.AC_data ) );
                APP_STATISTICS.getStorage();
            },
            fail: function (data, code) {
                console.log(`handling fail, code = ${code}`)
            }
        });
        // 获取设备信息
        device.getInfo({
            'success':function( data ){
                APP_STATISTICS.AC_deviceInfo = Object.assign( {} , data ); 
                // 查看获取到的设备信息
                // console.log( '查看获取到的设备信息 >>>>' , JSON.stringify( APP_STATISTICS.AC_deviceInfo ) );        

            }
        })
        // let page = router.getState(); //  
        // console.log( '路由信息>>>>' , page , typeof page );

        // 测试 请求
        // NETWORK.get({
        //     url:'/v2/movie/top250?count=20',
        //     success(data){
        //         console.log( `请求成功code= ${ data.code }, data=${ JSON.stringify(data) } ` );
                
        //     }
        // });
        
    },
    // 关闭app
    destroyApp(){
        
        console.log( "关闭app" );

        let d = new Date + '';
        // 关闭时间
        APP_STATISTICS.AC_data.destroyTime = d.getTime();
    },

    // 设置缓存
    setStorage(){

        console.log(1111);
        // 缓存数据
        let data = {
            'AC_data': APP_STATISTICS.AC_data,
            'AC_deviceInfo':APP_STATISTICS.AC_deviceInfo
        }
        let key = 'APP_STATISTICS_Data';

        storage.delete(
            key
        );
        storage.set({
            'key':'APP_STATISTICS_Data',
            'value':JSON.stringify( data ),
            success:function(){

                console.log( '设置缓存成功' );                
            }
        });
        
    },

    // 读取缓存
    getStorage(){
        console.log(2222);
        let data;
        let key = 'APP_STATISTICS_Data';

        storage.get({
            key,
            success: function (data) {
                // console.log( '读取到的缓存数据' ,data );
                let storageData = data && JSON.parse( data );

                if(  storageData && storageData.AC_data.deviceId ){
                    data = JSON.parse( data );
 
                }else{

                    APP_STATISTICS.setStorage()
                }

              }
        });
    }

};


// 全局变量
// const hookTo = global.__proto__ || global


export default APP_STATISTICS 