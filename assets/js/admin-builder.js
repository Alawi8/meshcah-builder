(function($) {
    'use strict';

    var canvas = $('#alawi-builder-canvas');
    var dataInput = $('#alawi_builder_data');
    var blockIndex = canvas.find('.alawi-block-item').length;

    function updateData() {
        var blocks = [];
        canvas.find('.alawi-block-item').each(function() {
            var $block = $(this);
            var type = $block.data('type');
            var data = {};
            $block.find('input[type="text"], input[type="color"], input[type="hidden"], textarea, select').each(function() {
                var name = $(this).attr('name');
                if (!name) return;
                var match = name.match(/\[(\w+)\]$/);
                if (match) data[match[1]] = $(this).val();
            });
            blocks.push({ type: type, data: data });
        });
        dataInput.val(JSON.stringify(blocks));
    }

    // Sortable
    canvas.sortable({
        handle: '.alawi-block-drag-handle',
        placeholder: 'alawi-block-placeholder',
        update: updateData
    });

    // Drag from palette
    $('.alawi-palette-block').on('dragstart', function(e) {
        e.originalEvent.dataTransfer.setData('blockType', $(this).data('type'));
    });

    canvas[0].addEventListener('dragover', function(e) { e.preventDefault(); });
    canvas[0].addEventListener('drop', function(e) {
        e.preventDefault();
        var type = e.dataTransfer.getData('blockType');
        if (!type) return;
        addBlock(type);
    });

    // Also click to add
    $('.alawi-palette-block').on('click', function() {
        addBlock($(this).data('type'));
    });

    function addBlock(type) {
        canvas.find('.alawi-canvas-empty').remove();
        $.post(alawiAdmin.ajaxUrl, {
            action: 'alawi_get_block_template',
            nonce: alawiAdmin.nonce,
            type: type,
            index: blockIndex++
        }, function(res) {
            if (res.success) {
                canvas.append(res.data);
                bindBlockEvents();
                updateData();
            }
        });
    }

    function bindBlockEvents() {
        canvas.find('.alawi-block-toggle').off('click').on('click', function() {
            $(this).closest('.alawi-block-item').find('.alawi-block-content').toggleClass('collapsed');
        });
        canvas.find('.alawi-block-remove').off('click').on('click', function() {
            $(this).closest('.alawi-block-item').remove();
            updateData();
        });
        canvas.find('input, textarea, select').off('change.alawi').on('change.alawi', updateData);
    }

    bindBlockEvents();

    // Media upload
    $(document).on('click', '.alawi-upload-btn', function(e) {
        e.preventDefault();
        var $input = $(this).siblings('.alawi-image-field');
        var frame = wp.media({ title: 'اختر صورة', multiple: false });
        frame.on('select', function() {
            var url = frame.state().get('selection').first().toJSON().url;
            $input.val(url);
            updateData();
        });
        frame.open();
    });

})(jQuery);
