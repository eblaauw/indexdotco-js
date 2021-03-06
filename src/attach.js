import config from 'config';
import Card from 'element/Card';
import Popover from 'element/Popover';

import parseElement from 'tool/parseElement';
import requestCardData from 'tool/requestCardData';
import requestListData from 'tool/requestListData';


var elementCreated = new Event(config.prefix+'elementCreated',{bubbles:true});
var popoverCreated = new Event(config.prefix+'popoverCreated',{bubbles:true});


var attachCard = function($element) {

	var parsedElement = parseElement($element);
	var rq = requestCardData(parsedElement.entity);
	var $card = window.jQuery('<div></div>').addClass(config.prefix+'cardStandalone')

	$element.replaceWith($card);
	$element = $card;

	rq.done(function(data){
		try {
			let card = new Card({
				data:data,
				actionable:true
			});
			$card.append(card.domElement);
			$element[0].dispatchEvent(elementCreated);
		} catch(error){
			console.error(`[index] error building card for ${parsedElement.entity}`);
		}
	})

}


var attachList = function($element) {

	var parsedElement = parseElement($element);
	var rq = requestListData(parsedElement.entity);
	var $card = window.jQuery('<div></div>').addClass(config.prefix+'cardStandalone');

	$element.replaceWith($card);
	rq.done(function(many_data){
		try {
			let base = $card.clone();
			for (const data of many_data) {
				let card = new Card({
					data:data,
					actionable:true
				});
				$card.append(card.domElement);
				let $a = base.clone();
				$card.after($a);
				$card = $a;
			}
			$card.remove();
		} catch(error){
			console.error(`[index] error building list for ${parsedElement.entity}`);
		}
	});
}


var attachIcon = function($element) {

	var parsedElement = parseElement($element);
	var rq = requestCardData(parsedElement.entity);

	$element.attr('target', '_blank').attr({
		'href': parsedElement.href + '?utm_source=thenextweb.com&utm_medium=referral&utm_campaign=hover-'+parsedElement.entity
	});

	$element.on('mouseover',function(ev){
		if(!$element.data(config.prefix+'hasIndexPopover') === true) {
			$element.data(config.prefix+'hasIndexPopover',true);
			rq.done(function(data){
				try {
					let card = new Card({
						data: data
					});
					let popover = new Popover({
						html: card.domElement,
						top: $element.offset().top,
						left: $element.offset().left + ($element.outerWidth() / 2)
					});
					popover.on('close',function(){
						$element.data(config.prefix+'hasIndexPopover',false);
					});
					popover.place();
					$element[0].dispatchEvent(elementCreated);
				} catch(error){
					console.error(`[index] error building popover for ${parsedElement.entity}`);
				}
			})
		}
	});
	$element.on('mouseout',function(ev){
		if(rq.state() !== 'resolved'){
			$element.data(config.prefix+'hasIndexPopover',false);
			rq.abort();
		}
	});

	$element[0].dispatchEvent(popoverCreated);

	if (typeof window.callPhantom === 'function') {
		$element.trigger('mouseover');
	}

};




const attach = function(typeOrTypes) {

	if(typeof typeOrTypes === 'object') {
		typeOrTypes.map(function(type){
			attach(type);
		})
	}
	else {
		let type = typeOrTypes;
		if(type === 'icon') {
			window.jQuery('a.'+config.prefix+'hasIcon').each(
				function(){
					attachIcon(window.jQuery(this))
				}
			);
		}
		else if(type === 'card') {
			window.jQuery('a.'+config.prefix+'hasCard').each(
				function(){
					attachCard(window.jQuery(this))
				}
			);
		}
		else if(type === 'list') {
			window.jQuery('a.'+config.prefix+'hasList').each(
				function(){
					attachList(window.jQuery(this))
				}
			);
		}
		else {
			throw `Invalid object type (${type})`;
		}
	}

}

export default attach;
