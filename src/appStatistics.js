import storage from '@system.storage' 
import nativeFetch from '@system.fetch'
import device from '@system.device'
import geolocation from '@system.geolocation'
import network from '@system.network'

import app from '@system.app'
import router from '@system.router'

// 加密文件
const aesjs = require("aes-js");

// 工具函数
const _toString = Object.prototype.toString;

function isObject (obj) {
    return obj !== null && typeof obj === 'object'
}

function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
}

function isArray(obj){
    return Array.isArray(obj)
}

function isEmptyObject(obj){
    for(var n in obj){
        return false
    }
    return true;
}

// 对象转为查询字符串
function toQueryString( obj ){
    var str = '';
    for(var n in obj){
        str += n + '=' + obj[n] + '&';
    }
    str = str.substring( 0 , str.length - 1 )
    return str
}

// 计算字符串的字节长度
function getByteLen(val) {
    var len = 0;
    for (var i = 0; i < val.length; i++) {
      if (val[i].match(/[^\x00-\xff]/ig) != null) //全角
          len += 2;
      else
          len += 1;
    }
    return len;
  }


//  驼峰式 转为 下划线式 
function getKebabCase( str ) {
    return str.replace( /[A-Z]/g, function( i ) {
        return '_' + i.toLowerCase();
    })
}

// 下划线 转 驼峰式
function getCamelCase( str ) {
    return str.replace( /_([a-z])/g, function( all, i ){ 
        return i.toUpperCase();
    } )
}


  //  128位密钥 加密 
function aesCbc_encrypt( string ){

    if( typeof string !== "string" ){
        console.log("string 必须是字符串");
        return 
    }
    var len = getByteLen( string ) % 16;

    // 待加密的文本转换为字节长度 必须为 16 的倍数，不足时，用 "$" 补位
    for (let index = 0; index <  ( len && ( 16 - len ) ) ; index++) {
        string += "$";                
    }        
    var textBytes = aesjs.utils.utf8.toBytes( string );
    
    var aesCbc = new aesjs.ModeOfOperation.cbc(KEY, IV);
    var encryptedBytes = aesCbc.encrypt(textBytes);
    
    // To print or store the binary data, you may convert it to hex
    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        
    return encryptedHex
}

// bcb 解密
function aesCbc_decrypted( string ) {
    
    var encryptedBytes = aesjs.utils.hex.toBytes( string );

    var aesCbc = new aesjs.ModeOfOperation.cbc(KEY, IV);
    var decryptedBytes = aesCbc.decrypt(encryptedBytes);

    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    return decryptedText
}

// 服务器地址
const SERVER_URL = "http://dev.data.so-quick.cn";

//  storage 的key值
const STORAGE_KEY = "APP_STATISTICS_DATA";

// 加密要用的秘钥
const KEY = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];

// 向量--分组加密时，作为初始的密文
// The initialization vector (must be 16 bytes)
const IV = [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,35, 36 ];

//  请求封装
const NETWORK = {

    'fetch':function( args ){

        let url = SERVER_URL + args.url;

        console.log( `日志url>>>>>: ${ url } ` );
        
        let obj = {
            url:SERVER_URL + args.url,
            fail:function(data, code){
                console.log(`请求失败, code = ${code}`);
            }
        };

        let arg = Object.assign( obj , args , { url } );

        console.log( "请求参数", JSON.stringify( obj ) );
        

        nativeFetch.fetch( obj );
    },
    'get':function( args ){

        args.method = "GET";
        return this.fetch( args );
    },
    'post':function( args ){

        args.method = "POST";
        return this.fetch( args );
    }
} 

// 统计代码
const APP_STATISTICS = {

    "baseData":{
        // 应用包名：应用的唯一标识
        "package":"",

        // 来源平台
        "packageName":"",
        
        // 快应用名称
        "name":"",

        // 快应用 版本
        "appVersionName":"",
        
        // 快应用 版本代码
        "appVersionCode":"",        

        // 设备唯一id
        "device":"",
        
        "mac":"",

        // 用户唯一id
        "user":"",

        // uuid 未授权时，生产的用户id
        "uuid":"",

        // 请求id
        "requestId": "req" + (new Date).getTime(),

        // 是否加密
        "hasEncrypt":"0",

        // 入口页面
        "entry":"",

        // 进入app的时间
        "time":""
    },

    // 设备信息
    "deviceInfo":{
        "brand":"",
        "manufacturer":"",
        "model":"",
        "product":"",
        "osType":"",
        "osVersionName":"",
        "osVersionCode":"",
        "platformVersionName":"",
        "platformVersionCode":"",
        "language":"",
        "region":"",
        "screenWidth":"",
        "screenHeight":""
    },

    // 地理位置
    "location":{
        'longitude':0,
        'latitude':0
    },

    // 获取 id 授权
    "deviceIdWarrant":false,
    // 设备信息授权
    "deviceInfoWarrant":false,
    // 地理位置授权
    "getLocationWarrant":false,
    // 网络类型授权
    "networkWarrant":false,

    // 打开app
    createApp( deviceData ){

        const APP = deviceData || { 'options':{} , '_def':{} };
                
        let d = new Date;
        // 解构出  env 和 manifest 对象
        let { options:{ env } , _def:{ manifest } } = APP;
        // 获取 packageName 值
        let { source } = app.getInfo();

        APP_STATISTICS.baseData.packageName = source.packageName;
        
        // 进入时间 
        APP_STATISTICS.baseData.time = d.getTime() + '';

        // 缓存请求 reqestId
        storage.set({
            key: '_SD_BD_REQUEST_ID_',
            value: APP_STATISTICS.baseData.requestId
        })

        for ( let key in APP_STATISTICS.baseData ) {

            if ( APP_STATISTICS.baseData.hasOwnProperty(key) ) {

                // 应用信息保存
                if( manifest[key] ){

                    APP_STATISTICS.baseData[key] = manifest[key];

                }  else if ( env[key] ){

                    APP_STATISTICS.baseData[key] = env[key];
                }

            }
        }

        // 获取 entry 页面
        APP_STATISTICS.baseData.entry = manifest.router.entry;
        
        // 获取信息
        APP_STATISTICS.getWarrantData();
        
    },
    // // 关闭app
    // destroyApp(){

    //     console.log( `关闭app` );
        
        
    // },
    // 获取授权信息
    getWarrantData(){

        // 读取设备id和用户id
        device.getId({

            'type': ['device', 'mac','user'], // 最少一个，最多四个
            'success': function (data) {

                APP_STATISTICS.baseData.device = data.device;
                APP_STATISTICS.baseData.mac = data.mac;
                APP_STATISTICS.baseData.user = data.user;

            },
            fail: function(data, code) {
                let dt = new Date();
                storage.get({
                    key: "_SD_BD_UUID_",
                    success: function(data) {
                        let rid = "";
                        if( data ){                   
                            rid = data;
                        } else {
                            rid = APP_STATISTICS.createUuId();
                            storage.set({
                                key: '_SD_BD_UUID_',
                                value: rid
                            })
                        }
                        APP_STATISTICS.baseData.uuid = rid;
                    },
                    fail: function(data, code) {
                        console.log("storage handling fail, code=" + code);
                    }
                })
            },
            'complete': function () {
                APP_STATISTICS.deviceIdWarrant = true;
            }
        });
        // 获取设备信息
        device.getInfo({
            'success':function( data ){

                for (const key in data ) {
                    if ( data.hasOwnProperty(key) ) {

                        APP_STATISTICS.deviceInfo[key] = data[key];                        
                    }
                }      

                // 品牌、型号、生产厂家 统一转换小写
                APP_STATISTICS.deviceInfo.brand = APP_STATISTICS.deviceInfo.brand.toLowerCase();
                APP_STATISTICS.deviceInfo.model = APP_STATISTICS.deviceInfo.model.toLowerCase();
                APP_STATISTICS.deviceInfo.manufacturer = APP_STATISTICS.deviceInfo.manufacturer.toLowerCase();
            
            },
            'complete': function () {
                APP_STATISTICS.deviceInfoWarrant = true;
            }
        });

        // 获取地理位置
        geolocation.getLocation({

            success: function (data) {
                //  经度、纬度 
                APP_STATISTICS.location.longitude = data.longitude;
                APP_STATISTICS.location.longitude = data.latitude;

            },
            'complete': function () {
                APP_STATISTICS.getLocationWarrant = true;
            }
        })

        // 获取网络状况
        network.getType({
            success: function (data) {
              console.log(`handling success: ${data.type}`)
            },
            'complete': function () {
                APP_STATISTICS.networkWarrant = true;
            }
          })

        //   监测用户是否完成授权 
        this.lisenerWarranting();
    },

    // 设置缓存
    setStorage(){

        console.log('开始设置缓存数据');
        // 缓存数据
        let data = {
            'baseData': APP_STATISTICS.baseData,
            'deviceInfo':APP_STATISTICS.deviceInfo,
            "location":APP_STATISTICS.location,
            'creteTime':(new Date)
        }
        
        storage.delete({
            'key':STORAGE_KEY
        });

        storage.set({
            'key':STORAGE_KEY,
            'value':JSON.stringify( data ),
            'success':function(){ 
                
                console.log( '设置缓存成功>>>>>>');    

            }
        });
        
    },

    // 读取缓存
    getStorage(){

        let that = this;
        storage.get({

            'key':STORAGE_KEY,
            'success': function (data) {

                let storageData = data && JSON.parse( data );

                if(  storageData ){   

                    delete storageData.creteTime;           
                    console.log('读取缓存成功...' , JSON.stringify( storageData ));
                    // 保存数据            
                    Object.assign( APP_STATISTICS , storageData );
                }else{
                    // 没有缓存 ， 申请用户授权，获取数据
                    that.getWarrantData();
                }               
            },
            "fail":function(){
                // 没有缓存 ， 申请用户授权，获取数据
                that.getWarrantData();
            }
        });
    },

    // 监听用户是否完成授权 （ 包含通过、未通过 ）
    lisenerWarranting(){
        
        const timer = setInterval( ()=>{
            
            // 所有授权完成，发送日志
            if( this.deviceIdWarrant && this.deviceInfoWarrant && this.getLocationWarrant && this.networkWarrant ){

                clearInterval( timer );
                console.log( `准备发送日志：` );
                
                // 设置缓存
                APP_STATISTICS.setStorage();
                    
                let args = Object.assign( {} , APP_STATISTICS.baseData , APP_STATISTICS.deviceInfo , APP_STATISTICS.location );
                        
                // console.log( '提交日志>>>>>>'  , aesCbc_encrypt( JSON.stringify( args ) )  );  
                storage.get({
                    key: '_SD_BD_REQUEST_ID_',
                    "success":function(data){
                        args.requestId = data;                        
                        APP_STATISTICS.submitLog( args );
                    },
                    "fail":function(){
                        args.requestId = APP_STATISTICS.baseData.requestId;
                        APP_STATISTICS.submitLog( args );
                    }
                })

            }
            
        },10 );
    },
    // 生成 uuid
    createUuId(){
        let id = "";

        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }

        id =  APP_STATISTICS.baseData.package + "-" + S4() + "-" + S4()+ "-" + S4(); 

        return id
    },
    // 保存日志数据
    submitLog( args ){

        // key值转换： 驼峰式 转为 下划线式
        let change_args = {};
        for ( const key in args ) {
            if ( args.hasOwnProperty(key) ) {
                change_args[ getKebabCase( key ) ] = args[key];                         
            }
        }
     
        // JSON转为查询字符串
        let argsToQueryStr = toQueryString( change_args );      

        // 加密
        argsToQueryStr = aesCbc_encrypt( argsToQueryStr );

        // 提交日志
        NETWORK.get({
            url:'/a.gif?' + argsToQueryStr ,
            success(data){
                if( data.code === 200 ){
                    console.log( `日志发送成功code= ${ data.code }, data=${ JSON.stringify(data) } ` );                                // 关闭之前设置缓存
                }                        
            }
        });
    },

    log(...arg){

        console.log( "统计函数>>>打印日志" ,  JSON.stringify(arguments[0]) );
        
    }


};


// 全局变量
const hookTo = global.__proto__ || global;

hookTo.APP_STATISTICS = APP_STATISTICS;

export default APP_STATISTICS 



