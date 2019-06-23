
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
    } else{
        alert("Sorry, browser does not support geolocation!");
    }
}

function sendReq(e){
    getLocation((position)=>{
        long = position.coords.longitude
        lat = position.coords.latitude
        ref.child('Customers Requests').push({
            info:e.children[0].value,
            lat:lat,
            long:long,
            user:uid,
            status:'0'
        })
    })
}
var lat,long,uid, reqsRev
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
                // [].forEach.call($C('vehicle'),e=>{
                //     e.remove()
                // })
                // $I('pop-vehicles').innerHTML = '<option value="">Select a vehicle</option>'
                vehicelsNum = 0
                tot=0
                m.forEach(d=>{tot++
                    if(d.val().status == '0'){
                        vehicelsNum++
                        var op = dc('option')
                        op.classList.add('vehicle')
                        op.innerHTML = 'Vehicle '
                        op.setAttribute('data-key',d.key)
                        op.value = op.innerHTML += d.val().number
                        $I('pop-vehicles').appendChild(op)
                    }
                })
                if(vehicelsNum == 0 && $I('reqs') != undefined){
                    $I('reqs').innerHTML = '<center>No vehicels available, Customers Requests are hidden</center>'
                    ref.child('stations/'+uid).update({vehNum:'0'})
                    cl('veh num 0')
                    ref.child('Customers Requests').once('value',n=>{
                        n.forEach(d=>{cl('cleaning')
                            if(d.val().status == '1' && d.val().nearestStation == uid)
                                ref.child('Customers Requests/'+d.key).update({nearestStation:'',status:'0'})
                        })
                    })
                }
                else if(vehicelsNum > 0  && $I('reqs') != undefined){
                    ref.child('stations/'+uid).update({vehNum:vehicelsNum})
                    forcedDisplay()
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
var Requests = [],stations = [],indexes = []
function prepareReqs(a){
    ref.child('stations').once('value',m=>{
        m.forEach(d=>{
            var cache = {
                "lat":d.val().lat,
                "long":d.val().long,
                "key":d.key
            }
            if(d.val().vehNum != '0')
            stations.push(cache)
        })
        sta = stations
    }).then(()=>{
        displayReqs()
    })
}

function displayReqs(){
    cl('display')
    ref.child('Customers Requests').orderByChild('key').on('child_added',n=>{
        if(vehicelsNum>0){
            calcDistance(n)
            cl('calcing')
        }
        
    })
    ref.child('Customers Requests').orderByChild('key').on('value',n=>{
        $I('reqs').innerHTML=''
        n.forEach(i=>reqBody(i))
    })
}

function forcedDisplay(){
    ref.child('Customers Requests').once('value',i=>{
        i.forEach(n=>{
            if(n.val().status == '1')
                calcDistance(n)
        })

    })
}

function calcDistance(d){
    cl('child added')
    data=[];da=0
    if((d.val().status == '0' || d.val().status == undefined) && vehicelsNum > 0){cl('caling')
        var long,lat
        if(d.val().info == undefined){
            d.val().l.forEach(d=>{
                data[da] = d
                da++
            })
            lat = data[0],long = data[1]
            cl('data from g child ' + lat + ' ' + long)
        }
        else {
            lat = d.val().lat,long = d.val().long
            cl('data from info child')
        }
        var sta1 = new Array(),org1 = new google.maps.LatLng(lat,long)

        stations.forEach(e=>{
            sta1.push(new google.maps.LatLng(e.lat, e.long))
        })
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
                    cl(f.distance.value)
                    if(f.distance.value < s){
                        s = f.distance.value
                        stationIndex = i%stations.length
                    }
                    i++
                })
                ref.child('Customers Requests/'+d.key).update({
                    nearestStation:stations[stationIndex].key,
                    status:'1'
                })
                var cachee = {[d.key]:stationIndex}
                indexes.push(cachee)
        }
    }
}

var on=false,data=[],da=0
function reqBody(n){
    data=[];da=0
    if(n.val().status == '1')
    if(n.val().nearestStation == uid && vehicelsNum > 0){
        var req = dc('div'),
        info = dc('p'),
        loc = dc('div'),
        respond = dc('button')

        if(n.val().info != undefined){
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
        }
        else{
            n.val().l.forEach(d=>{
                data[da] = d
                da++
            })
            latLng = new google.maps.LatLng(Number(data[0]), Number(data[1]))
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
    
            info.innerHTML = n.val().g
            respond.setAttribute('for', 'pop-checkbox')
            respond.innerHTML = 'Respond'
            respond.setAttribute("onclick","\
                $I('pop-info').innerHTML = '"+n.val().g+"';\
                $I('pop-sub').setAttribute('data-key','"+n.key+"');\
                toggle($I('pop'))")
        }
        

        req.appendChild(info)
        req.appendChild(loc)
        req.appendChild(respond)
        $I('reqs').appendChild(req)
        $I('reqs').appendChild(req)
    }
}

function response(e){
    if(e.getAttribute('data-key') != undefined){
        ref.child('Customers Requests/'+e.getAttribute('data-key')).update({
            status:'2',
            vehicle:$I('pop-vehicles').value
        })
        ref.child('stations/'+uid+'/vehicles/'+$I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key')).update({
            status:'1'
        }).then(()=>{
            $I('pop').classList.add('hide')
            forcedDisplay()
            ref.child('Customers Requests/'+e.getAttribute('data-key')).once('value',m=>{
                // cl($I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key'))
                var long,lat,inf
                if(m.val().info == undefined){
                    m.val().l.forEach(d=>{
                        data[da] = d
                        da++
                    })
                    lat = data[0],long = data[1]
                    cl('data from g child ' + lat + ' ' + long)
                    inf = ''
                }
                else {
                    lat = m.val().lat,long = m.val().long
                    inf = m.val().info
                    cl('data from info child')
                }
                ref.child('accidents/'+$I('pop-vehicles').options[$I('pop-vehicles').selectedIndex].getAttribute('data-key')).set({
                    [m.key]:{
                        lat:lat,
                        longtude:long,
                        info:inf,
                        status:m.val().status
                    }
                })
            })
        })
    }
}


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

function toggle(m){
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