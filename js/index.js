
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
function fill(e,t,w='equal'){
    if(w == 'plus')
        e.innerHTML += t
    if(w == 'equal')
        e.innerHTML = t
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
            if($I('reqs') != undefined){
                prepareReqs()
                ref.child('Customers Requests').on('child_added',n=>{
                    if(vehicelsNum>0){
                        calcDistance(n)
                    }
                    else clean_reqs()
                })
                ref.child('Customers Requests').on('child_changed',n=>{
                    if(vehicelsNum>0){
                        calcDistance(n)
                    }
                    else clean_reqs()
                })
                ref.child('Customers Requests').on('value',n=>{
                    fill($I('reqs'),'')
                    n.forEach(i=>reqBody(i))
                })
            }
            hideReg()
            uid = u.uid
            ref.child('stations/'+uid).once('value',m=>{
                fill($I('st-name'),m.val().name,'equal')
            })
            ref.child('stations/'+uid+'/vehicles').on('value',m=>{
                setTimeout(()=>{
                    [].forEach.call($C('vehicle'),e=>{
                        e.remove()
                    })
                    fill($I('pop-vehicles'),'','equal')
                    vehicelsNum = 0
                    tot=0
                    m.forEach(d=>{
                        tot++
                        if(d.val().status == '0'){
                            var lab = dc('label'),
                            inp = dc('input'),
                            br = dc('br')
                            
                            inp.type = 'checkbox'
                            inp.setAttribute('name','vehicle')
                            // inp.setAttribute('data-key',d.key)
                            vehicelsNum++
                            inp.onchange = ()=>{
                                vehiclesKeys.push(d.key)
                                cl('as')
                            }
                            lab.classList.add('vehicle')
                            fill(lab,'Vehicle ' + d.val().number + ' ')
                            lab.appendChild(inp)
                            $I('pop-vehicles').appendChild(lab)
                            $I('pop-vehicles').appendChild(br)
                        }
                    })
                    if(vehicelsNum == 0 && $I('reqs') != undefined){
                        clean_reqs()
                    }
                    else if(vehicelsNum > 0  && $I('reqs') != undefined){
                        ref.child('stations/'+uid).update({vehNum:vehicelsNum})
                        forcedDisplay()
                    }
                    $I('veh-num').innerHTML = 'number of vehicles available = '+vehicelsNum + ' from '+tot + ' registered'

                },200)
            })
        }
        else{
            if($I('reqs') != undefined)
                window.location.replace('index.html')
        }
    })
}

function clean_reqs(){
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

var req,sta
var Requests = [],stations = [],indexes = []
function prepareReqs(a){
    ref.child('stations').on('value',m=>{
        stations=[]
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
    })
}


function forcedDisplay(){
    ref.child('Customers Requests').once('value',i=>{
        i.forEach(n=>{
            if(n.val().status == '0')
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
        cl('dis req')
        if(n.val().lat != undefined){
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
    
            info.innerHTML = n.val().info
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
var vehiclesKeys =[]
function response(e){
    var checked=0;
    [].forEach.call(document.querySelectorAll("input[name='vehicle']"),d=>{if(d.checked) checked++})
    if(e.getAttribute('data-key') != undefined && checked > 0){
        [].forEach.call(vehiclesKeys,f=>{
            ref.child('Customers Requests/'+e.getAttribute('data-key')).update({
                status:'2'
            })
            ref.child('stations/'+uid+'/vehicles/'+f).update({
                status:'1'
            }).then(()=>{
                $I('pop').classList.add('hide')
                forcedDisplay()
                ref.child('Customers Requests/'+e.getAttribute('data-key')).once('value',m=>{
                    var long,lat,inf
                    if(m.val().lat == undefined){
                        m.val().l.forEach(d=>{
                            data[da] = d
                            da++
                        })
                        lat = data[0],long = data[1]
                        inf = m.val().info
                    }
                    else {
                        lat = m.val().lat,long = m.val().long
                        inf = m.val().info
                    }
                    ref.child('accidents/'+f).set({
                        [m.key]:{
                            lat:lat,
                            longtude:long,
                            info:inf,
                            status:m.val().status,
                            station:uid
                        }
                    })
                })
                cl(vehiclesKeys)
                vehiclesKeys = []
            }).catch(e=>{
                fill($I('pop-err'),e)
            })

        })


    }
    else if(checked == 0)
        fill($I('pop-err'),'please select at least one vehicle')
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
        }).catch(e=>{
            fill($I('sign-err'),e.message)
        })
    })
}

function stationLog(e){
    var email = $I('log-email').value,
    pass = $I('log-pass').value
    firebase.auth().signInWithEmailAndPassword(email,pass).then(()=>{
        $I('exampleModal').click()
    }).catch(e=>{
        fill($I('log-err'),e.message)
    })
}

function toggle(m){
    if(m != undefined && !on){
        if(m.classList.contains('hide'))
            m.classList.remove('hide')
        else m.classList.add('hide')
    }
    if($I('pop-err') != undefined)
        fill($I('pop-err'),'')
    if($I('sign-err') != undefined)
        fill($I('sign-err'),'')
    if($I('log-err') != undefined)
        fill($I('log-err'),'')
}

function addVeh(){
    var a = ref.child('stations/'+uid+'/vehicles').push()
    a.set({
        status:'0',
        number:a.key.charAt(8)
    })
}