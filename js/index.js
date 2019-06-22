
var ref = firebase.database().ref()

function cl(m){
    console.log(m)
}
function dc(m){
    return document.createElement(m)
}
function dt(m){
    return document.createTextNode(m)
}
function $I(m){
    return document.getElementById(m)
}
function $C(m){
    return document.getElementsByClassName(m)
}

function errorHandler(err) {
   if(err.code == 1) {
      alert("Error: Access is denied!");
   } else if( err.code == 2) {
      alert("Error: Position is unavailable!");
   }
}

function getLocation(e = ()=>{}){
   if(navigator.geolocation){
      // timeout at 60000 milliseconds (60 seconds)
      var options = {timeout:60000};
      navigator.geolocation.getCurrentPosition(e, errorHandler,options);
      //    e.innerHTML = 'Got it'
    } else{
        alert("Sorry, browser does not support geolocation!");
    }
}

function sendReq(e){
    getLocation((position)=>{
        long = position.coords.longitude
        lat = position.coords.latitude
        ref.child('requests').push({
            info:e.children[0].value,
            lat:lat,
            long:long,
            user:uid,
            status:'0'
        })
    })
}
var lat,long,uid, reqsRev
// function showLocation(position) {
//     var latitude = lat = position.coords.latitude;
//     var longitude = long = position.coords.longitude;
//     console.log(lat + ' ' + long)
//  }
var vehicelsNum = 0,tot=0
window.onload = ()=>{
    firebase.auth().onAuthStateChanged(u=>{
        if(u){
            if($I('reqs') != undefined)
               prepareReqs()
            hideReg()
            uid = u.uid
            ref.child('stations/'+uid).once('value',m=>{
                $I('st-name').innerHTML = m.val().name
            })
            ref.child('stations/'+uid+'/vehicles').on('value',m=>{
                setTimeout(()=>{[].forEach.call($C('vehicle'),e=>{
                    e.remove()
                    cl('remove vehicle')
                })},200)
                vehicelsNum = 0
                tot=0
                m.forEach(d=>{cl('asdas');tot++
                    if(d.val().status == '0'){
                        vehicelsNum++
                        var op = dc('option')
                        op.classList.add('vehicle')
                        op.innerHTML = 'Vehicle '
                        op.setAttribute('data-key',d.key)
                        op.value = op.innerHTML += d.val().number
                        $I('pop-vehicles').appendChild(op)
                        cl('add vehicle '+d.val().number)
                    }
                })
                if(vehicelsNum == 0 && $I('reqs') != undefined){
                    $I('reqs').innerHTML = '<center>No vehicels available, requests are hidden</center>'
                    ref.child('requests').once('value',n=>{
                        n.forEach(d=>{
                            if(d.val().status == '1' && d.val().nearestStation == uid)
                                ref.child('requests/'+d.key).update({nearestStation:'',status:'0'})
                        })
                    })
                }
                else if(vehicelsNum > 0  && $I('reqs') != undefined){
                    forcedDisplay()
                    cl('num > 0')
                }
                $I('veh-num').innerHTML = 'number of vehicles available = '+vehicelsNum + ' from '+tot + ' registered'
            })
        }
        else{
            if($I('reqs') != undefined)
                window.location.replace('index.html')
        }
    })
}

var req,sta
var requests = [],stations = [],indexes = []
function prepareReqs(a){
    ref.child('stations').once('value',m=>{
        m.forEach(d=>{
            var cache = {
                "lat":d.val().lat,
                "long":d.val().long,
                "key":d.key
            }
            stations.push(cache)
        })
        sta = stations
    }).then(()=>{
        displayReqs()
    })
}

function displayReqs(){
    cl('display')
    ref.child('requests').orderByChild('key').on('child_added',n=>{
        if(vehicelsNum>0){
            // reqBody(n);
            calcDistance(n)
        }
        
    })
    ref.child('requests').orderByChild('key').on('value',n=>{
        $I('reqs').innerHTML=''
        n.forEach(i=>reqBody(i))
    })
}

function forcedDisplay(){
    ref.child('requests').once('value',i=>{
        i.forEach(n=>{
            if(n.val().status == '1')
                calcDistance(n)
            // if(n.val().nearestStation == uid){
            //     $I('reqs').innerHTML = ''
            //     var req = dc('div'),
            //     info = dc('p'),
            //     loc = dc('div'),
            //     respond = dc('button')

            //     // map = new google.maps.Map(loc, {
            //     //     center: {lat:Number(n.val().lat), lng: Number(n.val().long)},
            //     //     zoom: 14
            //     // });

            //     latLng = new google.maps.LatLng(Number(n.val().lat), Number(n.val().long))
            //     var mapOptions = {
            //         center: latLng,
            //         zoom: 14,
            //         mapTypeId: google.maps.MapTypeId.ROADMAP
            //     };
            //     var map = new google.maps.Map(loc, mapOptions);

            //     var marker = new google.maps.Marker({
            //         position: latLng,
            //         title:"Destination",
            //         visible: true
            //     });
            //     marker.setMap(map);

            //     info.innerHTML = n.val().info
            //     respond.setAttribute('for', 'pop-checkbox')
            //     respond.innerHTML = 'Respond'
            //     respond.setAttribute("onclick","\
            //         $I('pop-info').innerHTML = '"+n.val().info+"';\
            //         $I('pop-sub').setAttribute('data-key','"+n.key+"');\
            //         toggle($I('pop'))")
                

            //     req.appendChild(info)
            //     req.appendChild(loc)
            //     req.appendChild(respond)
            //     $I('reqs').appendChild(req)
            //     $I('reqs').appendChild(req)
            // }
        })

    })
}

function calcDistance(d){
    cl('child added')
    if(d.val().status == '0'){
        // var cache = {
        //     "lat":d.val().lat,
        //     "long":d.val().long,
        //     "key":d.key
        // }
        var sta1 = new Array(),org1 = new google.maps.LatLng(d.val().lat, d.val().long)

        stations.forEach(e=>{
            sta1.push(new google.maps.LatLng(e.lat, e.long))
        })
        // var origin1 = new google.maps.LatLng(a.origin.lat, a.origin.long);

        // var destinationA = new google.maps.LatLng(50.087692, 14.421150),destinationB = new google.maps.LatLng(49.087692, 14.421150),destinationC = new google.maps.LatLng(51.087692, 14.421150);

        var service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
        {
            origins: [org1],
            destinations: sta1,
            travelMode: 'DRIVING'
        }, callback);

        function callback(response, status) {
            var i=0,s = response.rows[0].elements[0].distance.value,stationIndex=0
            response.rows[0].elements.forEach(f=>{
                // cl(f.distance.value)
                if(f.distance.value < s){
                    s = f.distance.value
                    stationIndex = i%stations.length
                }
                i++
            })
            ref.child('requests/'+d.key).update({
                nearestStation:stations[stationIndex].key,
                status:'1'
            })
            var cachee = {[d.key]:stationIndex}
            indexes.push(cachee)
        }
    }
}

var on=false
function reqBody(n){
    if(n.val().status == '1')
    if(n.val().nearestStation == uid){
        var req = dc('div'),
        info = dc('p'),
        loc = dc('div'),
        respond = dc('button')

        // map = new google.maps.Map(loc, {
        //     center: {lat:Number(n.val().lat), lng: Number(n.val().long)},
        //     zoom: 14
        // });

        latLng = new google.maps.LatLng(Number(n.val().lat), Number(n.val().long))
        var mapOptions = {
            center: latLng,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(loc, mapOptions);

        var marker = new google.maps.Marker({
            position: latLng,
            title:"Destination",
            visible: true
        });
        marker.setMap(map);

        info.innerHTML = n.val().info
        respond.setAttribute('for', 'pop-checkbox')
        respond.innerHTML = 'Respond'
        respond.setAttribute("onclick","\
            $I('pop-info').innerHTML = '"+n.val().info+"';\
            $I('pop-sub').setAttribute('data-key','"+n.key+"');\
            toggle($I('pop'))")
        

        req.appendChild(info)
        req.appendChild(loc)
        req.appendChild(respond)
        $I('reqs').appendChild(req)
        $I('reqs').appendChild(req)
    }
}

function response(e){
    if(e.getAttribute('data-key') != undefined){
        ref.child('requests/'+e.getAttribute('data-key')).update({
            status:'2',
            vehicle:$I('pop-vehicles').value
        })
        ref.child('stations/'+uid+'/vehicles/'+$I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key')).update({
            status:'1'
        }).then(()=>{
            $I('pop').classList.add('hide')
            forcedDisplay()
            ref.child('requests/'+e.getAttribute('data-key')).once('value',m=>{
                cl($I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key'))
                ref.child('accidents/'+$I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key')).set({
                    lat:m.val().lat,
                    long:m.val().long,
                    info:m.val().info,
                    status:m.val().status
                })
            })
        })
    }
}


// function distance(org,sta,f = ()=>{}){
//     cl('asd')
//     var sta1 = new Array(),org1 = new google.maps.LatLng(org.lat, org.long)

//     sta.forEach(e=>{
//         sta1.push(new google.maps.LatLng(e.lat, e.long))
//     })
//     // var origin1 = new google.maps.LatLng(a.origin.lat, a.origin.long);

//     // var destinationA = new google.maps.LatLng(50.087692, 14.421150),destinationB = new google.maps.LatLng(49.087692, 14.421150),destinationC = new google.maps.LatLng(51.087692, 14.421150);

//     var service = new google.maps.DistanceMatrixService();

//     service.getDistanceMatrix(
//     {
//         origins: org1,
//         destinations: sta1,
//         travelMode: 'DRIVING'
//     }, callback);

//     function callback(response, status) {
//         f(response.rows[0].elements)
//     }
// }


function hideReg(){
    var arr = $C('not-reg'),arr1 = $C('reg')
    if(arr != undefined){
        [].forEach.call(arr,e=>{
            e.classList.add('hide')
        });
        [].forEach.call(arr1,e=>{
            e.classList.remove('hide')
        })
    }
}
function stationReg(e){
    // e.preventDefault()
    getLocation((position)=>{
        long = position.coords.longitude
        lat = position.coords.latitude
        var name = $I('reg-name').value,
        email = $I('reg-email').value,
        pass = $I('reg-pass').value
        firebase.auth().createUserWithEmailAndPassword(email,pass).then(u=>{
            ref.child('stations/'+u.user.uid).set({
                name:name,
                email:email,
                long:long,
                lat:lat
            })
        })
    })
}

function stationLog(e){
    var email = $I('log-email').value,
    pass = $I('log-pass').value
    firebase.auth().signInWithEmailAndPassword(email,pass).then(()=>{
        $I('exampleModal').click()
    })
}

// function distance(lat1, lon1, lat2, lon2, unit) {
//     var radlat1 = Math.PI * lat1/180
//     var radlat2 = Math.PI * lat2/180
//     var radlon1 = Math.PI * lon1/180
//     var radlon2 = Math.PI * lon2/180
//     var theta = lon1-lon2
//     var radtheta = Math.PI * theta/180
//     var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
//     dist = Math.acos(dist)
//     dist = dist * 180/Math.PI
//     dist = dist * 60 * 1.1515
//     if (unit=="K") { dist = dist * 1.609344 }
//     if (unit=="N") { dist = dist * 0.8684 }
//     return dist
// } 

function toggle(m){
    cl('aa')
    if(m != undefined && !on){
        if(m.classList.contains('hide'))
            m.classList.remove('hide')
        else m.classList.add('hide')
    }
}

function addVeh(){
    var a = ref.child('stations/'+uid+'/vehicles').push()
    a.set({
        status:'0',
        number:a.key.charAt(8)
    })
}