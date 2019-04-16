( function( $ ) {
	
	/* Internal shorthand */
	var api = wp.customize;

	/**
	 * Helper class for the main Customizer interface.
	 * 
	 * @since 1.2.0
	 * @class FLCustomizer
	 */
	FLCustomizer = {
	
		/**
		 * Initializes our custom logic for the Customizer.
		 *
		 * @since 1.2.0
		 * @method init
		 */
		init: function()
		{
			FLCustomizer._initEvents();
			FLCustomizer._initToggles();
			FLCustomizer._initFonts();
			FLCustomizer._initPresets();
			FLCustomizer._initCodeEditors();
			FLCustomizer._initSliderControl();
			FLCustomizer._initCheckboxMultiple();
		},

		/**
		 * Initializes custom events for the Customizer.
		 *
		 * @since 1.3.3
		 * @method _initEvents
		 */
		_initEvents: function()
		{
			$( '.fl-preview-button' ).on( 'click', function() {
				wp.customize.previewer.refresh();
			} );
		},
	
		/**
		 * Initializes the logic for showing and hiding controls
		 * when a setting changes.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _initToggles
		 */
		_initToggles: function()
		{
			// Loop through each setting.
			$.each(FLCustomizerToggles, function( settingId, toggles ) {
			
				// Get the setting object. 
				api( settingId, function( setting ) {
					
					// Loop though the toggles for the setting.
					$.each( toggles, function( i, toggle ) {
						
						// Loop through the controls for the toggle.
						$.each( toggle.controls, function( k, controlId ) {
							
							// Get the control object.
							api.control( controlId, function( control ) {
								
								// Define the visibility callback.
								var visibility = function( to ) {
									control.container.toggle( toggle.callback( to ) );
								};
			
								// Init visibility.
								visibility( setting.get() );
								
								// Bind the visibility callback to the setting.
								setting.bind( visibility );
							});
						});
					});
				});
			});
		},
	
		/**
		 * Initializes logic for font controls.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _initFonts
		 */
		_initFonts: function()
		{
			$( '.customize-control-font select' ).each( FLCustomizer._initFont );
		},
	
		/**
		 * Initializes logic for a single font control.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _initFont
		 */
		_initFont: function()
		{
			var select  = $( this ),
				link    = select.data( 'customize-setting-link' ),
				weight  = select.data( 'connected-control' );
				
			if ( 'undefined' != typeof weight ) {
				api( link ).bind( FLCustomizer._fontSelectChange );
				FLCustomizer._setFontWeightOptions.apply( api( link ), [ true ] );
			}
		},
	
		/**
		 * Callback for when a font control changes.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _fontSelectChange
		 */
		_fontSelectChange: function()
		{
			FLCustomizer._setFontWeightOptions.apply( this, [ false ] );
		},
	
		/**
		 * Sets the options for a font weight control when a 
		 * font family control changes.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _setFontWeightOptions
		 * @param {Boolean} init Whether or not we're initializing this font weight control.
		 */
		_setFontWeightOptions: function( init )
		{
			var i               = 0,
				fontSelect      = api.control( this.id ).container.find( 'select' ),
				fontValue       = this(),
				selected 		= '',
				weightKey       = fontSelect.data( 'connected-control' ),
				weightSelect    = api.control( weightKey ).container.find( 'select' ),
				weightValue     = init ? weightSelect.val() : '400',
				weightObject    = null,
				weightOptions   = '',
				weightMap       = {
					'100': 'Thin 100',
					'200': 'Extra-Light 200',
					'300': 'Light 300',
					'400': 'Normal 400',
					'500': 'Medium 500',
					'600': 'Semi-Bold 600',
					'700': 'Bold 700',
					'800': 'Extra-Bold 800',
					'900': 'Ultra-Bold 900'
				};
				
			if ( 'undefined' != typeof FLFontFamilies.system[ fontValue ] ) {
				weightObject = FLFontFamilies.system[ fontValue ].weights;
			}
			else if ( 'undefined' != typeof FLFontFamilies.google[ fontValue ] ) {
				weightObject = FLFontFamilies.google[ fontValue ];
			}
			
			for ( ; i < weightObject.length; i++ ) {
				
				if ( 0 === i && -1 === $.inArray( weightValue, weightObject ) ) {
					weightValue = weightObject[ 0 ];
					selected 	= ' selected="selected"';
				}
				else {
					selected = weightObject[ i ] == weightValue ? ' selected="selected"' : '';
				}
				
				weightOptions += '<option value="' + weightObject[ i ] + '"' + selected + '>' + weightMap[ weightObject[ i ] ] + '</option>';
			}
			
			weightSelect.html( weightOptions );
			
			if ( ! init ) {
				api( weightKey ).set( '' );
				api( weightKey ).set( weightValue );
			}
		},
	
		/**
		 * Initializes logic for settings presets.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _initPresets
		 */
		_initPresets: function()
		{
			if ( typeof api.control( 'fl-preset' ) !== 'undefined' ) {
				api.control( 'fl-preset' ).container.find( 'select' ).on( 'change', FLCustomizer._presetChange );
			}
		},
	
		/**
		 * Callback for when the preset control changes.
		 *
		 * @since 1.2.0
		 * @access private
		 * @method _presetChange
		 */
		_presetChange: function()
		{
			var val         = $( this ).val(),
				settings    = $.extend( {}, FLCustomizerPresetDefaults, FLCustomizerPresets[ val ].settings ),
				control     = null,
				picker      = null;
			
			// Loop the settings.
			for ( key in settings ) {
				
				// Get the control instance.
				control = api.control.instance( key );
				
				// Set the preset setting.
				control.setting.set( settings[ key ] );
				
				// Update the color picker if a color control.
				picker = control.container.find( '.color-picker-hex' );
				
				if ( picker.length > 0 ) {
					picker.wpColorPicker( 'color', settings[ key ] );
				}
			}
		},
	
		/**
		 * Initializes code editor controls.
		 *
		 * @since 1.3.3
		 * @method _initCodeEditors
		 */
		_initCodeEditors: function()
		{
			ace.require( 'ace/ext/language_tools' );
			
			$( '.fl-code-editor' ).each( function() {
				
				var editDiv 		= $( this ),
					editMode		= editDiv.data( 'mode' ),
					editTextarea 	= editDiv.siblings( 'textarea' ),
					editor 			= ace.edit( editDiv[0] );
				
				editTextarea.hide();
				editor.$blockScrolling = Infinity;
				editor.renderer.setShowGutter( false );
				editor.getSession().setValue( editTextarea.val() );
				editor.getSession().setMode( 'ace/mode/' + editMode );
				
				editor.setOptions({
			        enableBasicAutocompletion: true,
			        enableLiveAutocompletion: true,
			        enableSnippets: false
			    });
				
				editor.getSession().on( 'change', function( e ) {
					editTextarea.val( editor.getSession().getValue() ).trigger( 'change' );
				});
			} );
		},

		/**
		 * Initializes the slider control.
		 *
		 * @since 1.5.0
		 * @method _initSliderControl
		 */
		_initSliderControl: function()
		{
			$( '.customize-control-slider .fl-slider-reset' ).click( function () {
				var $slider       = $( this ).closest( 'label' ).find( 'input' ),
					$text_input   = $( this ).closest( 'label' ).find( '#fl-range-value-input' );
					default_value = $slider.data( 'reset_value' );

				$slider.val( default_value );
				$slider.change();
				$text_input.val( default_value );
			});

			$( '.customize-control-slider input[type=range]' ).each(function() {
				var $slider     = $(this),
					$text_input = $( this ).closest( 'label' ).find( '#fl-range-value-input' );
					value       = $slider.attr( 'value' );

				$slider.on('input', function () {
					value = $slider.attr( 'value' );
					$text_input.val( value );
				});

				$text_input.on('keyup change', function(){
					$slider.val($text_input.val());
					$slider.change();
				});
				
			});
		},

		/**
		 * Initializes the multiple checkbox
		 *
		 * @since 1.5.3
		 * @method _initCheckboxMultiple
		 */
		_initCheckboxMultiple: function()
		{
			$( '.customize-control-checkbox-multiple input[type="checkbox"]' ).each(function(){
				var $checkbox = $(this);

				$checkbox.on('change', function() {

		            checkbox_values = $checkbox.parents( '.customize-control' ).find( 'input[type="checkbox"]:checked' ).map(
		                function() {
		                    return this.value;
		                }
		            ).get().join( ',' );

		            $checkbox.parents( '.customize-control' ).find( 'input[type="hidden"]' ).val( checkbox_values ).trigger( 'change' );
			    });
			});			
		}
	};
	
	$( function() { FLCustomizer.init(); } );
	
})( jQuery );