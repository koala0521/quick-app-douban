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

//  128位密钥 加密 
function aesCbc_encrypt( string ){

    if( typeof string !== "string" ){
        console.log("必须是字符串");
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

        // 请求id
        "requestId":"",

        // 是否加密
        "hasEncrypt":"0",

        // 入口页面
        "entry":"",

        // 进入app的时间
        "actionTime_create":"",
        
        // 离开app的时间        
        "actionTime_destroy":""
    },

    // 设备信息
    "AS_deviceInfo":{
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

    // 是否有缓存
    "hasStorage":false,

    //所有授权是否完成
    "hasWarrantCompleted":false,

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
        // 获取当前应用信息
        let { source } = app.getInfo();
        console.log( 'source 信息 >>>>' , JSON.stringify( source ) );
        
        // 进入时间 
        APP_STATISTICS.baseData.actionTime_create = d.getTime() + '';

        // 请求id
        APP_STATISTICS.baseData.requestId = 'req' + d.getTime();

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

        // 读取设备id和用户id
        device.getId({

            'type': ['device', 'mac','user'], // 最少一个，最多四个
            'success': function (data) {

                APP_STATISTICS.baseData.device = data.device;
                APP_STATISTICS.baseData.mac = data.mac;
                APP_STATISTICS.baseData.user = data.user;

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

                        APP_STATISTICS.AS_deviceInfo[key] = data[key];                        
                    }
                }      

                // 品牌、型号 统一转换小写
                APP_STATISTICS.AS_deviceInfo.brand = APP_STATISTICS.AS_deviceInfo.brand.toLowerCase();
                APP_STATISTICS.AS_deviceInfo.model = APP_STATISTICS.AS_deviceInfo.model.toLowerCase();

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
        
        // 读取缓存
        // APP_STATISTICS.getStorage();
    },
    // 关闭app
    destroyApp(){

        let d = new Date + '';
        // 关闭时间
        APP_STATISTICS.baseData.actionTime_destroy = d.getTime();
        // 设置缓存
        APP_STATISTICS.setStorage();

        console.log( `关闭app11111` );
        
    },

    // 设置缓存
    setStorage(){

        console.log('开始设置缓存数据');
        // 缓存数据
        let data = {
            'baseData': APP_STATISTICS.baseData,
            'AS_deviceInfo':APP_STATISTICS.AS_deviceInfo,
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

        console.log('读取缓存...');
        let that = this;
        storage.get({

            'key':STORAGE_KEY,
            'success': function (data) {
                console.log( '读取到的缓存数据' , data  );
                let storageData = data && JSON.parse( data );

                if(  storageData && storageData.baseData.deviceId ){                    
                    // console.log('读取成功...' , JSON.stringify( storageData ));
                    that.hasStorage = true;
                }               
                // APP_STATISTICS.setStorage();

              }
        });
    },

    // 监听用户是否完成授权 （ 包含通过、未通过 ）
    lisenerWarranting(){
        
        const timer = setInterval( ()=>{
            
            // 所有授权完成，发送日志
            if( this.deviceIdWarrant && this.deviceInfoWarrant && this.getLocationWarrant && this.networkWarrant ){

                clearInterval( timer );
                console.log( `准备发送日志：${ APP_STATISTICS.hasWarrantCompleted }` );
                
                // 设置缓存
                APP_STATISTICS.setStorage();
                    
                let args = Object.assign( {} , APP_STATISTICS.baseData , APP_STATISTICS.AS_deviceInfo , APP_STATISTICS.location );
                        
                console.log( '提交日志>>>>>>'  , aesCbc_encrypt( JSON.stringify( args ) )  );  

                let argsToQueryStr = toQueryString( args );      

                // 加密
                // argsToQueryStr = aesCbc_encrypt( argsToQueryStr );

                // 测试请求
                NETWORK.get({
                    url:'/a.gif?' + argsToQueryStr ,
                    success(data){
                        if( data.code === 200 ){
                            console.log( `日志发送成功code= ${ data.code }, data=${ JSON.stringify(data) } ` );                                // 关闭之前设置缓存
                        }                        
                    }
                });
            
            }
            
        },10 );
    }


};


// 全局变量
// const hookTo = global.__proto__ || global


export default APP_STATISTICS 



